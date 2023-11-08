/**
 * Controller for Topcoder Certification endpoints
 */

const service = require('../services/TopcoderCertificationService')
const errors = require('../common/errors')
const { getSkillM2M } = require('../common/helper')

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
        throw new errors.NotFoundError(`Topcoder Certification '${req.params.dashedName}' does not exist.`)
    }

    res.send(result)
}

/**
 * Update certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function updateCertification(req, res) {
    const cert = await service.getCertificationByDashedName(req.params.dashedName)

    if (!cert) {
        throw new errors.NotFoundError(`Topcoder Certification '${req.params.dashedName}' does not exist.`)
    }

    // validate the request body with Joi schema
    const validatedUpdate = service.validateCertificationUpdate(req.body)

    // remove duplicated skill ids if any
    validatedUpdate.skills = [...new Set(validatedUpdate.skills)]

    // verify if each skill id exists as a active skill
    for (let skillId of validatedUpdate.skills) {
        // this will throw if skill cannot be found/verified
        const skill = await getSkillM2M(skillId)
    }

    // update the certification
    const result = await service.updateCertification(cert, validatedUpdate)

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
    updateCertification,
}
