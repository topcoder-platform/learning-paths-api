// USE_KEYCLOAK=false must restore the pre-Keycloak Auth0 token request. Runs in its own
// process (node --test isolates files) because config and the helper load once.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const nock = require('nock');
const auth0 = {
  AUTH0_URL: 'https://tenant.test/oauth/token', AUTH0_AUDIENCE: 'https://m2m.test/',
  AUTH0_CLIENT_ID: 'auth0-trigger', AUTH0_CLIENT_SECRET: 'auth0-secret',
};
// Keycloak settings stay present to prove Auth0 mode never sends them anywhere.
Object.assign(process.env, auth0, {
  USE_KEYCLOAK: 'false', KEYCLOAK_ISSUER: 'https://mongo-trigger.test/realms/m2m', KEYCLOAK_AUDIENCE: 'https://api.test',
  KEYCLOAK_TOKEN_URL: 'https://mongo-trigger.test/m2m/token', KEYCLOAK_CLIENT_ID: 'mongo-trigger',
  KEYCLOAK_CLIENT_SECRET: 'synthetic-secret', KEYCLOAK_SCOPE: 'update:certification_progress',
});
delete process.env.AUTH_SCOPE;
const { getM2MToken } = require('../helper');

/** Return an unsigned token-shaped fixture; the Auth0 provider only decodes exp for caching. */
function token() {
  const now = Math.floor(Date.now() / 1000);
  const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'HS256' })}.${part({ sub: 'auth0-trigger@clients', iat: now, exp: now + 900 })}.fixture`;
}

test('USE_KEYCLOAK=false requests the Auth0 token from AUTH0_URL with the Auth0 client', async () => {
  nock.disableNetConnect();
  try {
    const jwt = token();
    const mock = nock('https://tenant.test').post('/oauth/token', body => body.grant_type === 'client_credentials' &&
      body.client_id === auth0.AUTH0_CLIENT_ID && body.client_secret === auth0.AUTH0_CLIENT_SECRET &&
      body.audience === auth0.AUTH0_AUDIENCE && body.auth0_url === auth0.AUTH0_URL && !('scope' in body))
      .reply(200, { access_token: jwt });
    assert.equal(await getM2MToken(), jwt);
    assert.equal(await getM2MToken(), jwt);
    assert.equal(mock.isDone(), true);
  } finally { nock.cleanAll(); nock.enableNetConnect(); }
});
