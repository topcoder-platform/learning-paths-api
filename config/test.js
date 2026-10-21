/**
 * Configuration file to be used while running tests
 */

module.exports = {
  ADMIN_TOKEN: process.env.ADMIN_TOKEN,
  COPILOT_TOKEN: process.env.COPILOT_TOKEN,
  USER_TOKEN: process.env.USER_TOKEN,
  EXPIRED_TOKEN: process.env.EXPIRED_TOKEN,
  INVALID_TOKEN: process.env.INVALID_TOKEN,
  M2M_FULL_ACCESS_TOKEN: process.env.M2M_FULL_ACCESS_TOKEN,
  M2M_READ_ACCESS_TOKEN: process.env.M2M_READ_ACCESS_TOKEN,
  M2M_UPDATE_ACCESS_TOKEN: process.env.M2M_UPDATE_ACCESS_TOKEN,
  S3_ENDPOINT: process.env.S3_ENDPOINT || 'localhost:9000',

}
