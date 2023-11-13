/**
 * This service provides operations on Learning Path courses.
 */

const db = require('../db/models')
const dbHelper = require('../common/dbHelper')
const Joi = require('joi')
const { expandSkillsM2M } = require('../common/helper')

/**
 * Search Courses - search for FCC courses
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCourses(criteria) {
    let page = criteria.page || 1
    let perPage = criteria.perPage || 50

    let options = {};

    if (criteria.key) {
        options.where = { key: criteria.key }
    }

    options.include = courseIncludes(criteria)
    options.attributes = courseIncludeAttributes();

    const model = db['FccCourse'];
    // transforming the returned data to not require a change in the front-end
    ({ count, rows } = await dbHelper.findAndCountAllPages(
        model,
        page,
        perPage,
        options));

    if (rows) {
        const expandedSkills = []

        for (const fccCourse of rows) {
            if (fccCourse.skills) {
                fccCourse.skills = await expandSkillsM2M(fccCourse.skills)
            }

            expandedSkills.push(fccCourse)
        }

        return { total: count, result: expandedSkills }
    }

    return { total: count, page, perPage, result: rows }
}

// include associated models to provide the
// front-end with a fully-formed response
function courseIncludes(criteria) {
    return [
        {
            model: db.FreeCodeCampCertification,
            as: 'freeCodeCampCertification',
            ...((criteria && criteria.certification) ? { where: { certification: criteria.certification } } : {}),
        },
        {
            model: db.ResourceProvider,
            as: 'resourceProvider',
            attributes: ['name', 'attributionStatement', 'url']
        },
        {
            model: db.FccModule,
            as: 'modules',
            order: ['order'],
            include: [{
                model: db.FccLesson,
                as: 'lessons',
                attributes: ['id', 'title', 'dashedName', 'isAssessment'],
                separate: true,
                order: ['order']
            }]
        }
    ]
}

// attributes to include in the included associations
function courseIncludeAttributes() {
    return {
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
}

/**
 * Get Course by ID
 * 
 * @param {String} id the Course ID
 * @returns {Object} the Course with given ID
 */
async function getCourse(id) {
    const course = await db.FccCourse.findByPk(id, {
        include: courseIncludes(),
        attributes: courseIncludeAttributes()
    });

    if (course && course.skills) {
        course.skills = await expandSkillsM2M(course.skills)
    }

    return course
}

/**
 * Gets the modules for a given course 
 * 
 * @param {String or Integer} id the ID of the course  
 * @returns array of course module objects
 */
async function getCourseModules(id) {
    return await getPostgresCourseModules(id)
}

async function getPostgresCourseModules(id) {
    return await db.FccModule.findAll({
        where: {
            fccCourseId: id
        },
        order: ['order'],
        attributes: {
            include: [
                [
                    // Note the wrapping parentheses in the call below!
                    db.sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "FccLessons" AS lesson
                        WHERE
                            lesson."fccModuleId" = "FccModule".id
                    )`),
                    'lessonCount'
                ]
            ]
        }
    })
}

/**
 * Update existing Fcc Course
 * 
 * @param {*} cert FccCourse instance
 * @param {*} data Data to update the model with
 * @returns 
 */
async function updateCourse(course, data) {
    return course.update(data)
}

/**
 * Validate update course payload with Joi schema
 * 
 * @param {*} payload Any
 */
function validateCourseUpdate(payload) {
    const schema = Joi.object({
        // TODO: only skills are currently supported for updates. Add more fields here as needed.
        skills: Joi.array().items(Joi.string().guid().required()).required(),
    })

    const { error, value } = schema.validate(payload)

    if (error) {
        throw error
    }

    return value
}

module.exports = {
    getCourse,
    getCourseModules,
    searchCourses,
    validateCourseUpdate,
    updateCourse
}
