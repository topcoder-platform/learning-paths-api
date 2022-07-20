/**
 * Controller for course endpoints
 */
const { StatusCodes } = require('http-status-codes')
const service = require('../services/CompletedCertificationsService')
const helper = require('../common/helper')

/**
 * Get all completed certifications
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getCompletedCertifications(req, res) {
    const result = await service.getCompletedCertifications(req.params.userId)
    res.send(result)
}

module.exports = {
    getCompletedCertifications
}
