/**
 * This service provides operations on Learning Path courses.
 */

const _ = require('lodash')
const { Course } = require('../models')
const Joi = require('joi')

const db = require('../db/models')
const dbHelper = require('../common/dbHelper')
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
    if (dbHelper.featureFlagUsePostgres()) {
        return await searchPostgresCourses(criteria)
    } else {
        return await searchDynamoCourses(criteria)
    }
}

async function searchPostgresCourses(criteria) {
    let page = criteria.page || 1
    let perPage = criteria.perPage || 50
    let total, result;

    let options = {};

    if (criteria.key) {
        options.where = { key: criteria.key }
    }

    // include associated models to provide the 
    // front-end with a fully-formed response
    const includeAssociations = [
        {
            model: db.ResourceProvider,
            as: 'resourceProvider',
            attributes: ['name', 'attributionStatement', 'url']
        },
        {
            model: db.FccModule,
            as: 'modules',
            include: [{
                model: db.FccLesson,
                as: 'lessons',
                attributes: ['id', 'title', 'dashedName', 'isAssessment'],
                separate: true,
                order: ['order']
            }]
        }
    ];
    options.include = includeAssociations;

    // add a computed attribute to get the count of modules
    // in the course
    options.attributes = {
        include: [
            [
                // Note the wrapping parentheses in the call below!
                db.sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM "FccModules" AS module
                    WHERE
                        module."fccCourseId" = "FccCourse".id
                )`),
                'moduleCount'
            ]
        ]
    };

    ({ count: total, rows: result } = await dbHelper.findAndCountAllPages(
        'FccCourse',
        page,
        perPage,
        options));

    return { total, page, perPage, result }
}

async function searchDynamoCourses(criteria) {
    if (criteria.provider) {
        return { total, page, perPage, result } = await searchCoursesForProvider(criteria)
    } else {
        return { total, page, perPage, result } = await scanAllCourses(criteria)
    }
}

/**
 * Queries the Course table using a global secondary index
 * and additional +where+ criteria from the given query 
 * 
 * @param {Object} criteria the query on which to search
 * @returns an array of Course objects
 */
async function searchCoursesForProvider(criteria) {
    let page = criteria.page || 1
    let perPage = criteria.perPage || 50

    const provider = criteria.provider;
    let queryStatement = Course.
        query("provider").eq(provider).
        using("provider-key-index")

    if (criteria.key) {
        queryStatement = queryStatement.where("key").eq(criteria.key)
    }
    if (criteria.certification) {
        queryStatement = queryStatement.where("certification").eq(criteria.certification)
    }

    let records = await queryStatement.exec();
    const total = records.length
    const result = records.slice((page - 1) * perPage, page * perPage)

    return { total, page, perPage, result };
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

/**
 * Generates a map of all lessons in a course and their associated module. 
 * 
 * @param {String} courseId the ID of the course of interest
 * @returns {Object} an object of lesson IDs and lesson and module names
 */
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
    scanAllCourses,
    searchCourses
}
