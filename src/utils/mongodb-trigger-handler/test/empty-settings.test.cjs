const assert = require('node:assert/strict');
const { generateKeyPairSync, sign } = require('node:crypto');
const { test } = require('node:test');
const nock = require('nock');
const issuer = 'https://mongo-trigger.test/realms/m2m';
const clientId = 'mongo-trigger';
// serverless.yml falls back to '' for every M2M value; here the Auth0 values and the scope are empty.
Object.assign(process.env, {
  USE_KEYCLOAK: 'true', AUTH0_URL: '', AUTH0_AUDIENCE: '', AUTH0_CLIENT_ID: '', AUTH0_CLIENT_SECRET: '',
  KEYCLOAK_ISSUER: issuer, KEYCLOAK_AUDIENCE: 'https://api.test', KEYCLOAK_TOKEN_URL: 'https://mongo-trigger.test/m2m/token',
  KEYCLOAK_CLIENT_ID: clientId, KEYCLOAK_CLIENT_SECRET: 'synthetic-secret', KEYCLOAK_SCOPE: '',
});
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const { getM2MToken } = require('../helper');

/** Sign a synthetic Keycloak service token carrying the client's default scope. */
function token() {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'skills' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ iss: issuer, aud: 'https://api.test', sub: 'service-skills', azp: clientId,
    gty: 'client-credentials', scope: 'update:certification_progress', iat: now, exp: now + 900 })).toString('base64url');
  return `${h}.${p}.${sign('RSA-SHA256', Buffer.from(`${h}.${p}`), privateKey).toString('base64url')}`;
}

test('an empty KEYCLOAK_SCOPE requests the client defaults instead of rejecting', async () => {
  nock.disableNetConnect();
  nock(issuer).get('/protocol/openid-connect/certs').reply(200, {
    keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'skills', alg: 'RS256', use: 'sig' }],
  });
  try {
    const jwt = token();
    const mock = nock('https://mongo-trigger.test').post('/m2m/token', body => !('scope' in body)).reply(200, { access_token: jwt, expires_in: 900 });
    assert.equal(await getM2MToken(), jwt);
    assert.equal(mock.isDone(), true);
  } finally { nock.cleanAll(); nock.enableNetConnect(); }
});
