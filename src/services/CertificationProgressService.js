/**
 * This service provides operations on Learning Path certification progress.
 */

const _ = require('lodash')
const Joi = require('joi')
const helper = require('../common/helper')

/**
 * Search Certification Progress
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCertificationProgresses(criteria) {

    records = await helper.scanAll('CertificationProgress')

    const page = criteria.page || 1
    const perPage = criteria.perPage || 50

    // filter data by given criteria
    if (criteria.userCertificationId) {
        records = _.filter(
            records,
            e => helper.partialMatch(criteria.userCertificationId, e.userCertificationId))
    }

    const total = records.length
    const result = records.slice((page - 1) * perPage, page * perPage)

    return { total, page, perPage, result }
}

searchCertificationProgresses.schema = {
    criteria: Joi.object().keys({
        page: Joi.page(),
        perPage: Joi.number().integer().min(1).max(100).default(100),
        provider: Joi.string(),
    })
}

/**
 * Get CertificationProgress by user ID and certification
 * 
 * @param {String} userId the user ID
 * @param {String} certification the certification key
 * @returns {Object} the certification progress for the given user and certification
 */
async function getCertificationProgress(userId, certification) {
    const tableKeys = { userId: userId, certification: certification }
    const ret = await helper.getByTableKeys('CertificationProgress', tableKeys)

    decorateModuleProgress(ret);

    return ret
}

getCertificationProgress.schema = {
    userId: Joi.string(),
    certification: Joi.string()
}

/**
 * Adds percentCompleted for each course.
 * 
 * @param {Object} progress the progress object to decorate
 */
function decorateModuleProgress(progress) {
    progress.modules.forEach(module => {
        const lessonCount = module.lessonCount || 0;
        const completedLessonCount = module.completedLessons.length || 0;

        let completedPercentage = 0;
        if (completedLessonCount > 0) {
            completedPercentage = Math.floor((completedLessonCount / lessonCount) * 100);
        }

        module.completedPercentage = completedPercentage;
    })
}

/**
 * @param {String} userId the user's ID
 * @param {String} certification the certification key
 * @param {Object} data the course data containing the current module and lesson
 * @returns {Object} the updated course progress
 */
async function updateCurrentLesson(userId, certification, data) {
    const tableKeys = { userId: userId, certification: certification }
    const progress = await helper.getByTableKeys('CertificationProgress', tableKeys)

    // Validate the data in the request
    const schema = Joi.object().keys(updateCurrentLesson.schema)
    const { error } = schema.validate({ data })
    if (error) {
        throw error
    }

    const currentLesson = `${data.module}/${data.lesson}`
    const currentLessonData = {
        currentLesson: currentLesson
    }
    return await helper.update(progress, currentLessonData)
}

updateCurrentLesson.schema = {
    userId: Joi.string(),
    certification: Joi.string(),
    data: Joi.object().keys({
        module: Joi.string().required(),
        lesson: Joi.string().required()
    }).required()
}

/**
 * Update a user's certification and course progress
 * 
 * @param {String} userId the user's ID
 * @param {String} certification the certification key
 * @param {Object} data the course progress data to be updated
 * @returns {Object} the updated course progress type
 */
async function updateCertificationProgress(userId, certification, data) {
    const tableKeys = { userId: userId, certification: certification }
    const progress = await helper.getByTableKeys('CertificationProgress', tableKeys)

    return await helper.update(progress, data)
}

updateCertificationProgress.schema = {
    userId: Joi.string(),
    certification: Joi.string(),
    data: Joi.object().keys({

    }).required()
}

module.exports = {
    searchCertificationProgresses,
    getCertificationProgress,
    updateCurrentLesson,
    updateCertificationProgress
}
