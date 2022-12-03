/**
 * This service provides operations on Learning Path courses.
 */

const _ = require('lodash')
const { Course } = require('../models')
const Joi = require('joi')
const helper = require('../common/helper')
const PROVIDER_FREECODECAMP = 'freeCodeCamp'

/**
 * Search Courses - uses a query using a global secondary index on 
 * provider if that criteria is provided, otherwise does a full table 
 * scan and filters data based on the criteria
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCourses(criteria) {
    if (criteria.provider) {
        return await searchCoursesForProvider(criteria)
    } else {
        const { result } = await scanAllCourses(criteria)
        return result;
    }
}

/**
 * Queries the Course table using a global secondary index
 * and additional +where+ criteria from the given query 
 * 
 * @param {Object} query the query on which to search
 * @returns an array of Course objects
 */
async function searchCoursesForProvider(query) {
    const provider = query.provider;
    let queryStatement = Course.
        query("provider").eq(provider).
        using("provider-key-index")

    if (query.key) {
        queryStatement = queryStatement.where("key").eq(query.key)
    }
    if (query.certification) {
        queryStatement = queryStatement.where("certification").eq(query.certification)
    }

    try {
        let courses = await queryStatement.exec();
        return courses;
    } catch (error) {
        console.error(error);
        return [];
    }
}

/**
 * Performs a full table scan and filters results to match the 
 * given criteria. A full scan is slow and expensive, so prefer 
 * to use query approach above if possible.
 * 
 * @param {Object} criteria the criteria on which to search
 * @returns an array of Course objects matching the search criteria
 */
async function scanAllCourses(criteria) {
    records = await helper.scanAll('Course')

    const page = criteria.page || 1
    const perPage = criteria.perPage || 50

    // filter data by given criteria
    if (criteria.certification) {
        records = _.filter(
            records,
            e => helper.fullyMatch(criteria.certification, e.certification))
    }

    if (criteria.key) {
        records = _.filter(
            records,
            e => helper.fullyMatch(criteria.key, e.key))
    }

    const total = records.length
    const result = records.slice((page - 1) * perPage, page * perPage)

    return { total, page, perPage, result }
}

scanAllCourses.schema = {
    criteria: Joi.object().keys({
        page: Joi.number(),
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
    id: Joi.string()
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
 * Returns a copy of a learning resource provider's lesson map. Attempts
 * to get the cached value and generates it in the case of a cache miss.
 * 
 * @param {String} provider name of the learning resource provider
 * @returns {Object} an object whose keys are the unique lesson IDs and 
 *      values are the lesson's module, course, and certification identifiers.
 */
async function getCourseLessonMap(provider = PROVIDER_FREECODECAMP) {
    const cacheKey = `lesson-map:${provider}`
    let lessonMap = helper.getFromInternalCache(cacheKey)

    if (!lessonMap) {
        lessonMap = await generateCourseLessonMap(provider);
        helper.setToInternalCache(cacheKey, lessonMap);
    }

    return lessonMap;
}

/**
 * Generates a map of all course lessons and their associated module, course,
 * and certification identifiers. Used to lookup what certification, course, 
 * and module a particular lesson belongs to.
 * 
 * @param {String} provider name of the learning resource provider
 * @returns {Object} an object whose keys are the unique lesson IDs and 
 *      values are the lesson's module, course, and certification identifiers.
 */
async function generateCourseLessonMap(provider) {
    courses = await helper.scanAll('Course')

    courses = _.filter(
        courses,
        e => helper.fullyMatch(provider, e.provider))

    let lessonMap = {};
    courses.forEach(course => {
        course.modules.forEach(module => {
            module.lessons.forEach(lesson => {
                lessonMap[lesson.id] = {
                    dashedName: lesson.dashedName,
                    moduleKey: module.key,
                    courseId: course.id,
                    certificationId: course.certificationId,
                    certification: course.certification
                }
            })
        })
    })

    return lessonMap;
}

async function courseLessonMap(courseId) {
    const course = await helper.getById('Course', courseId);

    let lessonMap = {};
    course.modules.forEach(module => {
        module.lessons.forEach(lesson => {
            lessonMap[lesson.id] = {
                dashedName: lesson.dashedName,
                moduleKey: module.key,
            }
        })
    })

    return lessonMap;
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
    id: Joi.string()
}

module.exports = {
    courseLessonMap,
    getCourse,
    getCourseLessonMap,
    getCourseModules,
    getCourseModule,
    searchCourses
}
