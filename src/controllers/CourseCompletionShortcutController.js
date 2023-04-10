/**
 * ExpressJS controller to auto-complete courses (for QA and testing)
 */

const service = require('../services/FccCourseCompletionShortcutService')

/**
 * Completes a freeCodeCamp course autotmatically, given the certification 
 * progress ID in the query object
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function shortcutFccCourseCompletion(req, res) {
    const certProgressId = req.params.certificationProgressId;
    const userId = req.authUser.userId;

    const result = await service.shortcutCompleteFccCourse(certProgressId, userId)

    res.send(result)
}

module.exports = {
    shortcutFccCourseCompletion
}