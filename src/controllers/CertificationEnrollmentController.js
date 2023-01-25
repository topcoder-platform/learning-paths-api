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

/**
 * Enrolls a user in a Topcoder Certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the new or existing enrollment
 */
async function enrollUser(req, res) {
    const { userId, certificationId } = req.params;
    const enrollment = await service.enrollUser(userId, certificationId)

    res.send(enrollment)
}

/**
 * Unenrolls a user from a Topcoder Certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the deleted enrollment, or null if the user wasn't enrolled
 */
async function unEnrollUser(req, res) {
    const { userId, certificationId } = req.params;
    const enrollment = await service.unEnrollUser(userId, certificationId)

    res.send(enrollment)
}

module.exports = {
    enrollUser,
    getEnrollment,
    unEnrollUser
}
