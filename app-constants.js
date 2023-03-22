const config = require('config')

/**
 * App constants
 */
const UserRoles = {
  TCAAdmin: 'TCA Admin',
  User: 'Topcoder User',
}

const EVENT_ORIGINATOR = 'topcoder-learning-paths-api'

const EVENT_MIME_TYPE = 'application/json'

module.exports = {
  EVENT_ORIGINATOR,
  EVENT_MIME_TYPE,
  UserRoles,
}
