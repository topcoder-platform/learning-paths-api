/**
 * Controller for Topcoder Certification Enrollment endpoints
 */

const service = require('../services/CertificationEnrollmentService')
const errors = require('../common/errors')

/**
 * Get certification enrollment
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getEnrollment(req, res) {
    const result = await service.getEnrollmentById(req.params.id)
    if (!result) {
        throw new errors.NotFoundError(`Topcoder Certification Enrollment id '${req.params.id}' does not exist.`)
    }

    res.send(result)
}

module.exports = {
    getEnrollment,
}
