/**
 * Controller for course endpoints
 */
const service = require('../services/CourseService')
const helper = require('../common/helper')

/**
 * Search courses
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function searchCourses(req, res) {
    const { result } = await service.searchCourses(req.query)
    helper.setResHeaders(req, res, result)
    res.send(result)
}

/**
 * Get course
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getCourse(req, res) {
    const result = await service.getCourse(req.params.courseId)
    res.send(result)
}

/**
 * Get course modules
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getCourseModules(req, res) {
    const result = await service.getCourseModules(req.params.courseId)
    res.send(result)
}

module.exports = {
    searchCourses,
    getCourse,
    getCourseModules,
}
