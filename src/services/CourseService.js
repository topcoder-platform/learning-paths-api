/**
 * This service provides operations on Learning Path courses.
 */

const _ = require('lodash')
const Joi = require('joi')
const helper = require('../common/helper')

/**
 * Search Courses
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCourses(criteria) {

    records = await helper.scanAll('Course')

    const page = criteria.page || 1
    const perPage = criteria.perPage || 50

    const total = records.length
    const result = records.slice((page - 1) * perPage, page * perPage)

    return { total, page, perPage, result }
}

searchCourses.schema = {
    criteria: Joi.object().keys({
        page: Joi.page(),
        perPage: Joi.number().integer().min(1).max(100).default(100),
        provider: Joi.string(),
    })
}

/**
 * Get Course by ID
 * 
 * @param {String} id the Course ID
 * @returns {Object} the Course with given ID
 */
async function getCourse(id) {
    const ret = await helper.getById('Course', id)
    return ret
}

getCourse.schema = {
    id: Joi.id()
}

/**
 * Get Course Modules by Course ID
 * 
 * @param {String} id the Course ID
 * @returns {Object} the Modules of the Course with given ID
 */
async function getCourseModules(id) {
    const course = await helper.getById('Course', id)

    ret = [];
    if (course) {
        ret = course.modules
    }
    return ret
}

getCourseModules.schema = {
    id: Joi.id()
}

module.exports = {
    searchCourses,
    getCourse,
    getCourseModules,
}

  // logger.buildService(module.exports)
