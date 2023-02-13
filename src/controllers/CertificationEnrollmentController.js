/**
 * Controller for Topcoder Certification Enrollment endpoints
 */

const service = require('../services/CertificationEnrollmentService')
const errors = require('../common/errors')
const { hasTCAAdminRole } = require('../common/helper')

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
    // check if auth user is enrolling himself
    // or an admin is enrolling someone
    if (userId !== req.authUser.userId && !hasTCAAdminRole(req.authUser)) {
        throw new errors.UnauthorizedError('You are not allowed to enroll members to certifications.')
    }

    const enrollment = await service.enrollUser(req.authUser, certificationId)

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
    // check if auth user is unenrolling himself
    // or an admin is unenrolling someone
    if (userId !== req.authUser.userId && !hasTCAAdminRole(req.authUser)) {
        throw new errors.UnauthorizedError('You are not allowed to unenroll members from certifications.')
    }

    const enrollment = await service.unEnrollUser(userId, certificationId, req.authUser)

    res.send(enrollment)
}

/**
 * Get user enrollment for a Topcoder Certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 * @returns {Object} the enrollment
 */
async function getUserEnrollment(req, res) {
    const { userId, certificationId } = req.params;

    const enrollment = await service.getEnrollment({
        where: {
            userId: userId,
            topcoderCertificationId: certificationId
        }
    })

    if (!enrollment) {
        throw new errors.NotFoundError(`Topcoder Certification Enrollment does not exist.`)
    }

    res.send(enrollment)
}

async function getAllUserEnrollments(req, res) {
    const { userId } = req.params;

    const enrollments = await service.getEnrollments({
        where: {
            userId: userId
        }
    })

    res.send(enrollments)
}

async function getEnrollmentProgress(req, res) {
    const { userId, certificationDashedName } = req.params;
    const progress = await service.getEnrollmentProgress(userId, certificationDashedName);

    res.send(progress)
}

async function getUserEnrollmentProgresses(req, res) {
    const { userId } = req.params;
    const progresses = await service.getUserEnrollmentProgresses(userId)

    res.send(progresses);
}

module.exports = {
    enrollUser,
    getAllUserEnrollments,
    getEnrollment,
    getEnrollmentProgress,
    getUserEnrollment,
    getUserEnrollmentProgresses,
    unEnrollUser,
}
