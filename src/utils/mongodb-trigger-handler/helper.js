/**
 * This file defines helper methods
 */

const config = require('config')
const m2mAuth = require('tc-core-library-js').auth.m2m
// USE_KEYCLOAK=true: Keycloak with the KEYCLOAK_* settings (AUTH0_* are ignored).
// Otherwise Auth0 with AUTH0_URL, AUTH0_AUDIENCE and AUTH0_CLIENT_ID/SECRET, posting
// straight to AUTH0_URL as before the Keycloak migration.
const m2m = m2mAuth({ ...config, AUTH0_PROXY_SERVER_URL: config.AUTH0_URL })

/**
 * Obtain a cached or new M2M token from the provider selected by USE_KEYCLOAK.
 * Keycloak mode uses KEYCLOAK_CLIENT_ID/SECRET and KEYCLOAK_SCOPE and verifies the token;
 * Auth0 mode uses AUTH0_CLIENT_ID/SECRET against AUTH0_URL. The handler sends the token
 * to the Learning Paths API. Takes no arguments.
 *
 * @returns {Promise<String>} the M2M token
 * @throws Rejects with a sanitized shared-core error when credentials are missing or issuance fails.
 */
async function getM2MToken() {
  return m2m.getMachineToken()
}

module.exports = {
  getM2MToken
}
