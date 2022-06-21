/**
 * The configuration file.
 */
const _ = require('lodash')
require('dotenv').config()

module.exports = {
  READONLY: process.env.READONLY === 'true' || false,
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,
  // used to properly set the header response to api calls for services behind a load balancer
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  API_VERSION: process.env.API_VERSION || 'v5',
  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  VALID_ISSUERS: process.env.VALID_ISSUERS || '["https://api.topcoder-dev.com", "https://api.topcoder.com", "https://topcoder-dev.auth0.com/"]',

  // used to get M2M token
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://www.topcoder-dev.com',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,

  AMAZON: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'FAKE_ACCESS_KEY',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || 'FAKE_SECRET_ACCESS_KEY',
    AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN || 'FAKE_SESSION_TOKEN',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    IS_LOCAL_DB: process.env.IS_LOCAL_DB ? process.env.IS_LOCAL_DB === 'true' : false,
    DYNAMODB_URL: process.env.DYNAMODB_URL || 'http://localhost:7777',
  },

  // health check timeout in milliseconds
  HEALTH_CHECK_TIMEOUT: process.env.HEALTH_CHECK_TIMEOUT || 3000,

  M2M_AUDIT_HANDLE: process.env.M2M_AUDIT_HANDLE || 'tcwebservice',

  INTERNAL_CACHE_TTL: process.env.INTERNAL_CACHE_TTL || 1800
}
