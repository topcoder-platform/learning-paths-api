const { test } = require('node:test')
const assert = require('node:assert/strict')
const { once } = require('node:events')
const { createHmac, generateKeyPairSync, sign } = require('node:crypto')

Object.assign(process.env, {
  AUTH_SECRET: 'a-fixture-secret-with-at-least-32-bytes',
  VALID_ISSUERS: '["https://issuer.test.invalid/"]',
  JWT_AUDIENCE: 'fixture-browser',
  AUTH0_AUDIENCE: 'fixture-machine',
  AUTH0_URL: 'https://auth.test.invalid/oauth/token',
  AUTH0_CLIENT_ID: 'fixture-client',
  AUTH0_CLIENT_SECRET: 'fixture-secret'
})

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
let rsaIssuer

function token (claims, secret = process.env.AUTH_SECRET, algorithm = claims.gty ? 'RS256' : 'HS256') {
  const rsa = algorithm === 'RS256'
  const header = Buffer.from(JSON.stringify(rsa ? { alg: 'RS256', typ: 'JWT', kid: 'fixture' } : { alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ emailVerified: true, iss: rsa ? rsaIssuer : 'https://issuer.test.invalid/', exp: Math.floor(Date.now() / 1000) + 60, ...claims })).toString('base64url')
  const data = `${header}.${payload}`
  const signature = rsa ? sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url') : createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${signature}`
}

test('actual route registration preserves anonymous access, authentication and role/scope gates', async (t) => {
  const app = require('express')()
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  rsaIssuer = `http://127.0.0.1:${server.address().port}/`
  process.env.VALID_ISSUERS = JSON.stringify(['https://issuer.test.invalid/', rsaIssuer])
  app.get('/.well-known/jwks.json', (req, res) => res.json({ keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'fixture', alg: 'RS256', use: 'sig' }] }))
  // PM-6770: the old ECS task supplied only the machine audience. A valid
  // browser token must fail there and succeed on the repaired progress routes.
  const { createJwtAuthenticator } = require('tc-core-library-js')
  app.get('/v5/missing-browser-audience', createJwtAuthenticator({
    AUTH_SECRET: process.env.AUTH_SECRET,
    VALID_ISSUERS: process.env.VALID_ISSUERS,
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE
  }), (req, res) => res.json({ user: req.authUser }))
  const routes = require('../../src/routes')
  // Substitute only database-backed controller actions; exercise the real router,
  // authentication middleware and service authorization rules over HTTP.
  for (const verbs of Object.values(routes)) {
    for (const def of Object.values(verbs)) {
      const file = require.resolve(`../../src/controllers/${def.controller}`)
      if (!require.cache[file]) require.cache[file] = { id: file, filename: file, loaded: true, exports: {} }
      require.cache[file].exports[def.method] = (req, res) => res.json({ user: req.authUser || null })
    }
  }
  require('../../app-routes')(app)
  app.use((err, req, res, next) => res.status(err.status || err.httpStatus || 500).json({ message: err.message }))
  async function status (path, claims, secret, method = 'GET', algorithm) {
    const headers = claims === undefined ? {} : { authorization: `Bearer ${token(claims, secret, algorithm)}` }
    const response = await fetch(`http://127.0.0.1:${server.address().port}/v5${path}`, { headers, method })
    await response.text()
    return response.status
  }
  assert.equal(await status('/learning-paths/certifications'), 200)
  assert.equal(await status('/learning-paths/certifications', { iss: 'https://untrusted.invalid/', userId: '123' }), 200)
  assert.equal(await status('/learning-paths/courses/fixture', undefined, undefined, 'PATCH'), 401)
  assert.equal(await status('/learning-paths/courses/fixture', { userId: '123', roles: ['TCA Admin'] }, undefined, 'PATCH'), 200)
  assert.equal(await status('/learning-paths/courses/fixture', { userId: '123', roles: ['Topcoder User'] }, undefined, 'PATCH'), 403)
  assert.equal(await status('/learning-paths/courses/fixture', { userId: '123', roles: ['TCA Admin'] }, 'incorrect-secret', 'PATCH'), 401)
  assert.equal(await status('/learning-paths/courses/fixture', { userId: '123', roles: ['TCA Admin'], iss: 'https://untrusted.invalid/' }, undefined, 'PATCH'), 401)
  assert.equal(await status('/learning-paths/courses/fixture', { userId: '123', roles: ['TCA Admin'], exp: 1 }, undefined, 'PATCH'), 401)
  const browser = { userId: '123', roles: ['Topcoder User'], aud: 'fixture-browser' }
  const browserStatus = (path, claims = browser) => status(path, claims, undefined, 'GET', 'RS256')
  assert.equal(await browserStatus('/missing-browser-audience'), 401)
  for (const path of ['/learning-paths/topcoder-certifications/123/progresses', '/learning-paths/certification-progresses?userId=123']) {
    await t.test(`browser authentication for ${path}`, async () => {
      assert.equal(await browserStatus(path), 200)
      assert.equal(await status(path), 401)
      assert.equal(await browserStatus(path, { ...browser, aud: 'another-client' }), 401)
      assert.equal(await browserStatus(path, { ...browser, iss: 'https://untrusted.invalid/' }), 401)
      assert.equal(await browserStatus(path, { ...browser, exp: 1 }), 401)
      assert.equal(await browserStatus(path, { ...browser, emailVerified: false }), 401)
      assert.equal(await browserStatus(path, { ...browser, emailVerified: undefined }), 401)
      const signed = token(browser, undefined, 'RS256').split('.')
      const payload = JSON.parse(Buffer.from(signed[1], 'base64url').toString())
      signed[1] = Buffer.from(JSON.stringify({ ...payload, userId: '456' })).toString('base64url')
      const response = await fetch(`http://127.0.0.1:${server.address().port}/v5${path}`, {
        headers: { authorization: `Bearer ${signed.join('.')}` }
      })
      await response.text()
      assert.equal(response.status, 401)
    })
  }
  const scoped = '/learning-paths/certification-progresses/complete-lesson-via-mongo-trigger'
  assert.equal(await status(scoped, { gty: 'client-credentials', aud: 'fixture-machine', scope: 'update:certification_progress' }, undefined, 'PUT'), 200)
  assert.equal(await status(scoped, { gty: 'client-credentials', aud: 'fixture-machine', scope: 'read:other' }, undefined, 'PUT'), 403)
  assert.equal(await status(scoped, { gty: 'client-credentials', aud: 'different-api', scope: 'update:certification_progress' }, undefined, 'PUT'), 401)
  assert.equal(await status(scoped, { gty: 'client-credentials', aud: 'fixture-browser', scope: 'update:certification_progress' }, undefined, 'PUT'), 401)
})
