/**
 * Controller for learning resource provider endpoints
 */

const service = require('../services/LearningResourceProviderService')
const helper = require('../common/helper')

/**
 * Search learning resource providers
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function searchLearningResourceProviders(req, res) {
  const result = await service.searchLearningResourceProviders(req.query)
  helper.setResHeaders(req, res, result)
  res.send(result.result)
}

module.exports = {
  searchLearningResourceProviders,
}
