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

    // filter data by given criteria
    if (criteria.provider) {
        records = _.filter(
            records,
            e => helper.fullyMatch(criteria.provider, e.provider))
    }

    if (criteria.certification) {
        records = _.filter(
            records,
            e => helper.fullyMatch(criteria.certification, e.certification))
    }

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
    var course = await helper.getById('Course', id)

    decorateWithModuleCount(course);

    return course
}

getCourse.schema = {
    id: Joi.id()
}

/**
 * Decorates a Course object by adding a moduleCount 
 * attribute with the number of modules in the course 
 * 
 * @param {Object} course the course to decorate
 * @returns {Object} the decorated course
 */
function decorateWithModuleCount(course) {
    if (!course) { return course }

    if (course.modules) {
        course.moduleCount = course.modules.length
    }

    decorateModules(course.modules);

    return course;
}

/**
 * Get Course Modules by Course ID
 * 
 * @param {String} id the Course ID
 * @returns {Object} the Modules of the Course with given ID
 */
async function getCourseModules(id) {
    const course = await helper.getById('Course', id)

    var modules = [];
    if (course) {
        modules = decorateModules(course.modules)
    }
    return modules
}

/**
 * Get Course Modules by Course ID and module key
 * 
 * @param {String} id the Course ID
 * @param {String} moduleKey the key id of the module
 * @returns {Object} the Module 
 */
async function getCourseModule(id, moduleKey) {
    const course = await helper.getById('Course', id)

    const module = course.modules.find(module => module.key === moduleKey);
    if (module) {
        decorateWithLessonCount(module)
    }

    return module
}

/**
 * Decorates each element of the collection with lession counts
 * 
 * @param {Array} modules a collection of course modules
 * @returns the modules decorated with additional attributes
 */
function decorateModules(modules) {
    modules.forEach(module => {
        decorateWithLessonCount(module)
    });

    return modules
}

/**
 * Adds a lessonCount attribute to a course module 
 * 
 * @param {Object} module the module to decorate
 */
function decorateWithLessonCount(module) {
    if (!module.lessons) { return module }

    module.meta.lessonCount = module.lessons.length

    return module
}

getCourseModules.schema = {
    id: Joi.id()
}

module.exports = {
    searchCourses,
    getCourse,
    getCourseModules,
    getCourseModule
}
