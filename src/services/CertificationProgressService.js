/**
 * This service provides operations on Learning Path certification progress.
 */

const _ = require('lodash')
const Joi = require('joi')
const helper = require('../common/helper')
const { CertificationProgress } = require('../models')

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
    let result = records.slice((page - 1) * perPage, page * perPage)
    decorateProgresses(result)

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
    const progress = await helper.getByTableKeys('CertificationProgress', tableKeys)

    decorateModuleProgress(progress);

    return progress
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
    if (!progress.modules) {
        return
    }

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
 * Decorates a collection of certification progresses with additional data
 * 
 * @param {Array} progresses an array of CertificationProgress objects
 */
function decorateProgresses(progresses) {
    progresses.forEach(progress => {
        decorateModuleProgress(progress)
    })
}

/**
 * @param {String} userId the user's ID
 * @param {String} certification the certification key
 * @param {Object} data the course data containing the current module and lesson
 * @returns {Object} the updated course progress
 */
async function updateCurrentLesson(userId, certification, data) {
    // Validate the data in the request
    const schema = Joi.object().keys(updateCurrentLesson.schema)
    const { error } = schema.validate({ data })
    if (error) {
        throw error
    }

    const progress = await getUserCertificationProgress(userId, certification);

    // TODO: we don't do any validation here to see if the module + lesson
    // are a valid combination for this certification -- would need to hit 
    // a different API endpoint to retrieve that data if we feel it's necessary.
    const currentLesson = `${data.module}/${data.lesson}`
    const currentLessonData = {
        currentLesson: currentLesson
    }

    let updatedProgress = await helper.update(progress, currentLessonData)
    decorateModuleProgress(updatedProgress);

    // NOTE: it seems that Dynamoose doesn't convert a Date object from a Unix
    // timestamp to a JS Date object on +update+.
    return updatedProgress
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
 * @param {String} userId the user's ID
 * @param {String} certification the certification key
 * @param {Object} data the course data containing the module/lesson to complete
 * @returns {Object} the updated course progress
 */
async function completeLesson(userId, certification, data) {
    // Validate the data in the request
    const schema = Joi.object().keys(completeLesson.schema)
    const { error } = schema.validate({ data })
    if (error) {
        throw error
    }

    let progress = await getUserCertificationProgress(userId, certification);
    decorateModuleProgress(progress)
    const moduleName = data.module;
    const lessonName = data.lesson;

    const moduleIndex = progress.modules.findIndex(mod => mod.module == moduleName)
    if (moduleIndex == -1) {
        throw `Module '${moduleName}' not found in certification '${certification}'`
    }

    const lesson = progress.modules[moduleIndex].completedLessons.find(lesson => lesson.dashedName == lessonName)
    if (lesson) {
        // it's already been completed, so no-op and return the current progress object
        console.log("Lesson already completed", lesson);
        return progress
    } else {
        const completedLesson = {
            dashedName: lessonName,
            completedDate: new Date()
        }
        progress.modules[moduleIndex].completedLessons.push(completedLesson)

        const updatedModules = {
            modules: progress.modules
        }

        let updatedProgress = await helper.update(progress, updatedModules)
        decorateModuleProgress(updatedProgress);

        return updatedProgress
    }
}

completeLesson.schema = {
    userId: Joi.string(),
    certification: Joi.string(),
    data: Joi.object().keys({
        module: Joi.string().required(),
        lesson: Joi.string().required()
    }).required()
}

async function addCompletedLesson(userId, certification, moduleIndex, lesson) {

    const completedLesson = {
        dashedName: lesson,
        completedDate: "2022-06-21T12:00:00.000Z"
    }

    await CertificationProgress.update({ userId: userId, certification: certification })


}
/**
 * Retrieve a specific user certification progress record from the database
 * 
 * @param {String} userId the ID of the user
 * @param {String} certification the certification key to update
 * @returns {Object} the certification progress object
 */
async function getUserCertificationProgress(userId, certification) {
    const tableKeys = { userId: userId, certification: certification }
    return await helper.getByTableKeys('CertificationProgress', tableKeys)
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
    updateCertificationProgress,
    completeLesson
}
