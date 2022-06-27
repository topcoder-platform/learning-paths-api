/**
 * This service provides operations on Learning Path certification progress.
 */

const _ = require('lodash')
const { CertificationProgress } = require('../models')
const helper = require('../common/helper')
const Joi = require('joi')
const { v4: uuidv4 } = require('uuid');

const STATUS_COMPLETED = "completed";
const STATUS_IN_PROGRESS = "in-progress";

/**
 * Create a new certification progress record 
 * 
 * @param {String} userId the user's ID
 * @param {Object} data object containing the provier, certification, module and lesson the user has started
 * @returns {Object} the new CertificationProgress object, or the existing one for the certification
 */
async function startCertification(userId, data) {
    let existingProgress;
    const { provider, certification } = { data }
    try {
        const searchCriteria = {
            userId: userId,
            provider: provider,
            certification: certification
        }
        existingProgress = await searchCertificationProgresses(searchCriteria)
    } catch (NotFoundError) {
        // no-op 
    }

    // if the certification has already been started, just return it
    if (existingProgress) {
        console.log(`User '${userId}' has already started the ${provider} '${certification}' certification`)
        return existingProgress
    } else {
        // create a new certification progress record
        console.log(`Starting certification ${provider} '${certification}' certification for user '${userId}'`)
        validateWithSchema(startCertification.schema, data)

        const newCertificationProgress = {
            id: uuidv4(),
            userId: userId,
            certification: certification,
            status: "in-progress",
            startDate: new Date(),
            currentLesson: `${data.module}/${data.lesson}`,
            modules: [
                {
                    module: data.module,
                    moduleStatus: "in-progress",
                    lessonCount: 0, // TODO: retrieve this value from the course info
                    completedLessons: [],
                    completedPercentage: 0
                }
            ]
        }

        return await helper.create('CertificationProgress', newCertificationProgress)
    }
}

startCertification.schema = {
    userId: Joi.string(),
    data: Joi.object().keys({
        provider: Joi.string().required(),
        certification: Joi.string().required(),
        module: Joi.string().required(),
        lesson: Joi.string().required()
    }).required()
}

/**
 * Marks a certification as completed in the Certification Progress record
 * 
 * @param {String} certificationProgressId the ID of the user's certification progress to complete
 * @param {Object} data the course data containing the current module and lesson
 * @returns {Object} the updated course progress
 */
async function completeCertification(certificationProgressId) {
    const progress = await getCertificationProgress(certificationProgressId);

    const userId = progress.userId;
    const provider = progress.provider;
    const certification = progress.certification;

    const completionData = {
        completedDate: new Date(),
        status: STATUS_COMPLETED
    }

    // TODO: What kind of validation should we do here to verify that the user has 
    // completed all of the required modules and lessons to earn a certification?
    let updatedProgress = await helper.update(progress, completionData)
    console.log(`User [${userId}] has completed [${provider}] certification [${certification}]`);
    decorateModuleProgress(updatedProgress);

    // TODO: it seems that Dynamoose doesn't convert a Date object from a Unix
    // timestamp to a JS Date object on +update+.
    return updatedProgress
}

/**
 * Validate the body of an API request against a model schema
 * 
 * @param {Object} modelSchema a Dynamoose Schema defined on a model
 * @param {Object} data an object containing the raw JSON body of the request
 */
function validateWithSchema(modelSchema, data) {
    const schema = Joi.object().keys(modelSchema)
    const { error } = schema.validate({ data })
    if (error) {
        throw error
    }
}

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
    // filter by user ID
    if (criteria.userId) {
        records = _.filter(
            records,
            e => helper.partialMatch(criteria.userId, e.userId))
    }

    // filter by certification
    if (criteria.certification) {
        records = _.filter(
            records,
            e => helper.partialMatch(criteria.certification, e.certification))
    }

    // filter by provider 
    if (criteria.provider) {
        records = _.filter(
            records,
            e => helper.partialMatch(criteria.provider, e.provider))
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
        userId: Joi.string(),
        certification: Joi.string(),
        provider: Joi.string(),
    })
}

/**
 * Get CertificationProgress by user ID and certification
 * 
 * @param {String} progressId the ID of the CertificationProgress 
 * @returns {Object} the certification progress for the given user and certification
 */
async function getCertificationProgress(progressId) {
    let progress = await helper.getById('CertificationProgress', progressId)

    decorateModuleProgress(progress);

    return progress
}

getCertificationProgress.schema = {
    progressId: Joi.string()
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
 * @param {String} certificationProgressId the ID of the certification progress record
 * @param {Object} data the course data containing the current module and lesson
 * @returns {Object} the updated course progress
 */
async function updateCurrentLesson(certificationProgressId, data) {
    validateWithSchema(updateCurrentLesson.schema, data)

    const progress = await getCertificationProgress(certificationProgressId);

    // TODO: we don't do any validation here to see if the module + lesson here
    // are a valid combination for this certification -- would need to look up
    // that data if we want to validate it.
    const currentLesson = `${data.module}/${data.lesson}`
    const currentLessonData = {
        currentLesson: currentLesson
    }

    let updatedProgress = await helper.update(progress, currentLessonData)
    decorateModuleProgress(updatedProgress);

    // TODO: it seems that Dynamoose doesn't convert a Date object from a Unix
    // timestamp to a JS Date object on +update+.
    return updatedProgress
}

updateCurrentLesson.schema = {
    certificationProgressId: Joi.string(),
    data: Joi.object().keys({
        module: Joi.string().required(),
        lesson: Joi.string().required()
    }).required()
}

/**
 * Marks a lesson as complete in the Certification Progress
 * 
 * @param {String} certificationProgressId the certification progress Id
 * @param {Object} data the course data containing the module/lesson to complete
 * @returns {Object} the updated course progress
 */
async function completeLesson(certificationProgressId, data) {
    // Validate the data in the request
    const schema = Joi.object().keys(completeLesson.schema)
    const { error } = schema.validate({ data })
    if (error) {
        throw error
    }

    let progress = await getCertificationProgress(certificationProgressId);
    const userId = progress.userId;
    const certification = progress.certification;
    decorateModuleProgress(progress)

    const moduleName = data.module;
    const lessonName = data.lesson;

    const moduleIndex = progress.modules.findIndex(mod => mod.module == moduleName)
    if (moduleIndex == -1) {
        throw `Module '${moduleName}' not found in certification '${certification}'`
    }

    const lesson = progress.modules[moduleIndex].completedLessons.find(
        lesson => lesson.dashedName == lessonName)

    if (lesson) {
        // it's already been completed, so just log it and return the current progress object
        console.log(`User [${userId}] has already completed ${certification}/${moduleName}/${lessonName}`);
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
        console.log(`User [${userId}] completed ${certification}/${moduleName}/${lessonName}`);

        decorateModuleProgress(updatedProgress);
        return updatedProgress
    }
}

completeLesson.schema = {
    certificationProgressId: Joi.string(),
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
    startCertification,
    completeCertification,
    searchCertificationProgresses,
    getCertificationProgress,
    updateCurrentLesson,
    updateCertificationProgress,
    completeLesson
}
