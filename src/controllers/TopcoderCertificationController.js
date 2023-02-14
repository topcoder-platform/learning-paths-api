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
    const result = await service.searchCertifications(req.query)

    res.send(result)
}

/**
 * Get certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getCertification(req, res) {
    const result = await service.getCertificationByDashedName(req.params.dashedName)

    if (!result) {
        throw new errors.NotFoundError(`Topcoder Certification id '${req.params.dashedName}' does not exist.`)
    }

    res.send(result)
}

/**
 * Public endpoint to validate TCA cert ownership
 * for members by handle
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function validateCertOwnership(req, res) {
    const certification = await service.getCertificationByDashedName(req.params.dashedName)

    if (!certification) {
        throw new errors.NotFoundError(`Topcoder Certification named '${req.params.dashedName}' does not exist.`)
    }

    const enrollment = await service.validateCertOwnership(certification.id, req.params.userHandle)

    res.send({
        certification,
        enrollment
    })
}

module.exports = {
    searchCertifications,
    getCertification,
    validateCertOwnership,
}
