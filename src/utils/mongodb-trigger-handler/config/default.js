/**
 * The configuration file.
 */
require('dotenv').config()

module.exports = {
  // M2M provider switch, read by tc-core-library-js (auth.useKeycloak): "true" uses the
  // KEYCLOAK_* settings below; unset, empty or "false" uses the Auth0 settings below.
  USE_KEYCLOAK: process.env.USE_KEYCLOAK,

  // Auth0 M2M settings, used when USE_KEYCLOAK is not true
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://www.topcoder-dev.com',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,

  // Keycloak M2M settings, used when USE_KEYCLOAK=true
  KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
  KEYCLOAK_AUDIENCE: process.env.KEYCLOAK_AUDIENCE,
  KEYCLOAK_TOKEN_URL: process.env.KEYCLOAK_TOKEN_URL,
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_SCOPE: process.env.KEYCLOAK_SCOPE,

  LEARNING_PATHS_API_ENDPOINT: process.env.LEARNING_PATHS_API_ENDPOINT,

}
