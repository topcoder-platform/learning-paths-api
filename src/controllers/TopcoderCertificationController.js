/**
 * Controller for Topcoder Certification endpoints
 */

const service = require('../services/TopcoderCertificationService')
const errors = require('../common/errors')

/**
 * Search certifications
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function searchCertifications(req, res) {
    const result = await service.getCertifications(req.query)

    res.send(result)
}

/**
 * Get certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getCertification(req, res) {
    const result = await service.getCertification(req.params.id)
    if (!result) {
        throw new errors.NotFoundError(`Topcoder Certification id '${req.params.id}' does not exists.`)
    }

    res.send(result)
}

module.exports = {
    searchCertifications,
    getCertification,
}
