/**
 * ExpressJS controller to auto-complete courses (for QA and testing)
 */

const helper = require('../common/helper')
const service = require('../services/CourseCompletionShortcutService')

/**
 * Completes a freeCodeCamp course autotmatically, given the certification 
 * progress ID in the query object
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function shortcutFccCourseCompletion(req, res) {
    const certProgressId = req.params.certificationProgressId;
    // TODO: to secure this in production we need to create a user role, eg 'TCA Admin'
    // that is required for a user to invoke this endpoint.
    const userId = req.authUser.userId;

    const result = await service.shortcutCompleteFccCourse(certProgressId, userId)

    res.send(result)
}

module.exports = {
    shortcutFccCourseCompletion
}