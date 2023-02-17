/**
 * Controller for `completed-certification` endpoints
 */
const service = require('../services/CompletedCertificationsService')

/**
 * Get all completed courses and certifications
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getCompletedCertifications(req, res) {
    const courses = await service.getCompletedCertifications(req.params.userId);
    const enrollments = await service.getCompletedTCAEnrollments(req.params.userId);

    res.json({
        courses,
        enrollments
    });
}

module.exports = {
    getCompletedCertifications
}
