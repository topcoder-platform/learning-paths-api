/**
 * Controller for learning resource provider endpoints
 */
const { StatusCodes } = require('http-status-codes')
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

/**
 * Get learning resource provider
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getLearningResourceProvider(req, res) {
  const result = await service.getLearningResourceProvider(req.params.providerId)
  res.send(result)
}

module.exports = {
  searchLearningResourceProviders,
  getLearningResourceProvider,
}
