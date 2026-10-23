// USE_KEYCLOAK=false must restore the pre-Keycloak Auth0 outbound behaviour. Runs in its
// own process (node --test isolates files) because config and the helpers load once.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const nock = require('nock');
const auth0 = {
  AUTH0_URL: 'https://tenant.test/oauth/token', AUTH0_PROXY_SERVER_URL: 'https://proxy.test/token',
  AUTH0_AUDIENCE: 'https://m2m.test/', AUTH0_CLIENT_ID: 'auth0-learning', AUTH0_CLIENT_SECRET: 'auth0-secret'
};
// Keycloak settings stay present to prove Auth0 mode never sends them anywhere.
Object.assign(process.env, auth0, { USE_KEYCLOAK: 'false', KEYCLOAK_ISSUER: 'https://learning.test/realms/m2m',
  KEYCLOAK_AUDIENCE: 'https://api.test', KEYCLOAK_TOKEN_URL: 'https://learning.test/m2m/token',
  KEYCLOAK_CLIENT_ID: 'learning-test', KEYCLOAK_CLIENT_SECRET: 'synthetic-secret', KEYCLOAK_SCOPE: 'update:certification_progress' });
delete process.env.AUTH_SCOPE;

/** Return an unsigned token-shaped fixture; the Auth0 provider only decodes exp for caching. */
function token(subject) {
  const now = Math.floor(Date.now() / 1000);
  const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'HS256' })}.${part({ sub: subject, iat: now, exp: now + 900 })}.fixture`;
}

/** Match the Auth0 client-credentials body that core 3.x sent for these settings. */
function auth0Body(body) {
  return body.grant_type === 'client_credentials' && body.client_id === auth0.AUTH0_CLIENT_ID &&
    body.client_secret === auth0.AUTH0_CLIENT_SECRET && body.audience === auth0.AUTH0_AUDIENCE &&
    body.auth0_url === auth0.AUTH0_URL && !('scope' in body);
}

test.before(() => nock.disableNetConnect());
test.after(() => { nock.cleanAll(); nock.enableNetConnect(); });

test('USE_KEYCLOAK=false gets outbound API tokens from AUTH0_URL with the Auth0 client', async () => {
  const { getMemberDataM2M } = require('../src/common/helper');
  const jwt = token('auth0-learning@clients');
  const issuer = nock('https://tenant.test').post('/oauth/token', auth0Body).reply(200, { access_token: jwt });
  const api = nock('https://api.topcoder-dev.com', { reqheaders: { authorization: `Bearer ${jwt}` } })
    .get('/v5/members/fixture').twice().reply(200, { handle: 'fixture' });
  assert.equal((await getMemberDataM2M('fixture')).handle, 'fixture');
  assert.equal((await getMemberDataM2M('fixture')).handle, 'fixture');
  assert.equal(issuer.isDone(), true);
  assert.equal(api.isDone(), true);
});

test('USE_KEYCLOAK=false gives the Bus wrapper the AUTH0_* settings and proxy', async () => {
  const { postBusEvent } = require('../src/common/helper');
  const jwt = token('auth0-bus@clients');
  const proxy = nock('https://proxy.test').post('/token', auth0Body).reply(200, { access_token: jwt });
  const bus = nock('https://api.topcoder-dev.com', { reqheaders: { authorization: `Bearer ${jwt}` } })
    .post('/v5/bus/events').reply(204);
  await postBusEvent('test.topic', {});
  assert.equal(proxy.isDone(), true);
  assert.equal(bus.isDone(), true);
});
