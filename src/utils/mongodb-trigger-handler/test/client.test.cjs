const { test } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const path = require('node:path')
const { once } = require('node:events')

test('Mongo trigger obtains one token and forwards each completed challenge', async t => {
  const requests = []
  const server = http.createServer(async (req, res) => {
    let body = ''
    for await (const part of req) body += part
    requests.push({ url: req.url, method: req.method, authorization: req.headers.authorization, body })
    res.setHeader('Content-Type', 'application/json')
    res.end(req.url === '/oauth/token' ? JSON.stringify({ access_token: 'fixture-token', expires_in: 3600, token_type: 'Bearer' }) : '{}')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  Object.assign(process.env, {
    NODE_CONFIG_DIR: path.join(__dirname, '../config'),
    AUTH0_URL: `${base}/oauth/token`, AUTH0_AUDIENCE: 'fixture-audience',
    AUTH0_CLIENT_ID: 'fixture-client', AUTH0_CLIENT_SECRET: 'fixture-secret',
    LEARNING_PATHS_API_ENDPOINT: `${base}/complete`
  })
  const { handle } = require('../handler')
  await handle({ detail: {
    fullDocument: { externalId: 'auth0|123', email: 'fixture@example.invalid' },
    updateDescription: { updatedFields: { 'completedChallenges.0': { id: 'lesson-a' }, 'completedChallenges.1': { id: 'lesson-b' }, unrelated: 'ignored' } }
  } })
  assert.equal(requests.filter(r => r.url === '/oauth/token').length, 1)
  const updates = requests.filter(r => r.method === 'PUT')
  assert.equal(updates.length, 2)
  assert.deepEqual(updates.map(r => new URL(r.url, base).searchParams.get('lessonId')), ['lesson-a', 'lesson-b'])
  for (const request of updates) {
    assert.equal(request.authorization, 'Bearer fixture-token')
    assert.equal(new URL(request.url, base).searchParams.get('userId'), '123')
  }
})
