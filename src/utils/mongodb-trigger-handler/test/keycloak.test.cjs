const assert = require('node:assert/strict');
const { generateKeyPairSync, sign } = require('node:crypto');
const { test } = require('node:test');
const nock = require('nock');
const issuer = 'https://mongo-trigger.test/realms/m2m';
const clientId = 'mongo-trigger';
// USE_KEYCLOAK=true: the Auth0 settings below must be ignored (their host is never mocked).
Object.assign(process.env, {
  USE_KEYCLOAK: 'true', AUTH0_URL: 'https://tenant.test/oauth/token', AUTH0_AUDIENCE: 'https://m2m.test/',
  AUTH0_CLIENT_ID: 'auth0-trigger', AUTH0_CLIENT_SECRET: 'auth0-secret', KEYCLOAK_ISSUER: issuer, KEYCLOAK_AUDIENCE: 'https://api.test',
  KEYCLOAK_TOKEN_URL: 'https://mongo-trigger.test/m2m/token', KEYCLOAK_CLIENT_ID: clientId,
  KEYCLOAK_CLIENT_SECRET: 'synthetic-secret', KEYCLOAK_SCOPE: 'update:certification_progress',
});
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const { getM2MToken } = require('../helper');
/** Sign an isolated service fixture; optional changes exercise rejected token contracts. */
function token(changes = {}) {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'skills' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ iss: issuer, aud: 'https://api.test', sub: 'service-skills',
    azp: clientId, gty: 'client-credentials', scope: 'update:certification_progress', iat: now, exp: now + 900, ...changes })).toString('base64url');
  const input = `${h}.${p}`;
  return `${input}.${sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url')}`;
}
test('Mongo trigger helper rejects invalid tokens and caches verified service credentials', async () => {
  nock.disableNetConnect();
  nock(issuer).persist().get('/protocol/openid-connect/certs').reply(200, {
    keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'skills', alg: 'RS256', use: 'sig' }],
  });
  try {
    for (const changes of [{ aud: 'wrong' }, { azp: 'other-client' }, { scope: 'read:certification_progress' }, { roles: ['administrator'] }]) {
      const mock = nock('https://mongo-trigger.test').post('/m2m/token').reply(200, { access_token: token(changes), expires_in: 900 });
      await assert.rejects(getM2MToken(), /^Error: Keycloak M2M token request failed$/);
      assert.equal(mock.isDone(), true);
    }
    const jwt = token();
    const mock = nock('https://mongo-trigger.test').post('/m2m/token', body => body.scope === 'update:certification_progress').reply(200, { access_token: jwt, expires_in: 900 });
    assert.equal(await getM2MToken(), jwt);
    assert.equal(await getM2MToken(), jwt);
    assert.equal(mock.isDone(), true);
  } finally { nock.cleanAll(); nock.enableNetConnect(); }
});
