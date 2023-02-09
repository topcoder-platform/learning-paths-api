/**
 * Controller for certification endpoints
 */
const service = require('../services/CertificationService')
const helper = require('../common/helper')

/**
 * Search certifications
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function searchCertifications(req, res) {
    const result = await service.searchCertifications(req.query)
    helper.setResHeaders(req, res, result)
    res.send(result.result)
}

/**
 * Get certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getCertification(req, res) {
    const result = await service.getCertification(req.params.certificationId)
    res.send(result)
}

module.exports = {
    searchCertifications,
    getCertification,
}
