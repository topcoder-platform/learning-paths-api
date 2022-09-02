/**
 * Controller for health check endpoint
 */
const config = require('config')

const service = require('../services/LearningResourceProviderService')
const errors = require('../common/errors')

// the topcoder-healthcheck-dropin library returns checksRun count,
// here it follows that to return such count
let checksRun = 0

/**
 * Check health of the app
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function checkHealth(req, res) {
  // perform a quick database access operation, if there is no error and is quick, then consider it healthy;
  // there are just a few learning resource providers, so searching them should be an efficient operation,
  // and it just searches a single provider, it should be quick operation
  checksRun += 1
  const timestampMS = new Date().getTime()
  try {
    await service.searchLearningResourceProviders({ page: 1, perPage: 1 })
  } catch (e) {
    throw new errors.ServiceUnavailableError(`An error occurred checking the database, ${e.message}`)
  }

  const duration = new Date().getTime() - timestampMS;
  if (duration > Number(config.HEALTH_CHECK_TIMEOUT)) {
    throw new errors.ServiceUnavailableError(`Database operation is slow, health check took ${duration} ms.`)
  }
  // there is no error, and it is quick, then return checks run count
  res.send({ checksRun })
}

module.exports = {
  checkHealth
}
