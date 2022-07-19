/**
 * This service provides operations on Learning Path certification progress.
 */

const _ = require('lodash')
const { CertificationProgress } = require('../models')
const errors = require('../common/errors')
const helper = require('../common/helper')
const Joi = require('joi')
const models = require('../models')
const { v4: uuidv4 } = require('uuid')

const STATUS_COMPLETED = "completed";
const STATUS_IN_PROGRESS = "in-progress";
const STATUS_NOT_STARTED = "not-started";

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
            e => helper.fullyMatch(criteria.userId, e.userId))
    }

    // filter by certification
    if (criteria.certification) {
        records = _.filter(
            records,
            e => helper.fullyMatch(criteria.certification, e.certification))
    }

    // filter by certification ID
    if (criteria.certificationId) {
        records = _.filter(
            records,
            e => helper.fullyMatch(criteria.certificationId, e.certificationId))
    }

    // filter by course ID
    if (criteria.courseId) {
        records = _.filter(
            records,
            e => helper.fullyMatch(criteria.courseId, e.courseId))
    }

    // filter by provider 
    if (criteria.provider) {
        records = _.filter(
            records,
            e => helper.fullyMatch(criteria.provider, e.provider))
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
 * Create a new certification progress record 
 * 
 * @param {String} userId the user's ID
 * @param {Object} data object containing the provier, certification, module and lesson the user has started
 * @returns {Object} the new CertificationProgress object, or the existing one for the certification
 */
async function startCertification(userId, certificationId, courseId, data) {
    let existingProgress;
    try {
        const searchCriteria = {
            userId: userId,
            certificationId: certificationId,
            courseId: courseId
        }
        results = await searchCertificationProgresses(searchCriteria)
        existingProgress = results.result[0];
    } catch (NotFoundError) {
        // no-op 
    }

    // if the certification has already been started, just return it
    if (existingProgress) {
        const provider = existingProgress.provider;
        const certification = existingProgress.certification;
        const startDate = existingProgress.startDate;

        console.log(`User [${userId}] already started the [${provider}] [${certification}] certification on [${startDate}]`)
        return existingProgress
    } else {
        return await buildNewCertificationProgress(userId, certificationId, courseId, data);
    }
}

startCertification.schema = {
    userId: Joi.string(),
    certificationId: Joi.string(),
    courseId: Joi.string(),
    data: Joi.object().keys({
        module: Joi.string().required(),
        lesson: Joi.string().required()
    }).required()
}

/**
 * Creates a new Certification Progress record for the given user and certification.
 * This method looks up the Certification record to validate it and also retrieves some
 * metadata about the associated course, such as the lessonCount.
 * 
 * @param {String} userId the user ID
 * @param {String} certificationId the UUID of the certification to start
 * @param {String} courseId the UUID of the course
 * @param {Object} data the module and lesson in the course on which the user is starting
 * @returns 
 */
async function buildNewCertificationProgress(userId, certificationId, courseId, data) {
    // next call will throw and return an error if the certificationId doesn't exist,
    // so just let that happen since the API will return the error to the client
    const certification = await helper.getById('Certification', certificationId);
    validateWithSchema(startCertification.schema, data)

    const course = await helper.getById('Course', courseId);
    const courseModules = course.modules;
    const currentModule = courseModules.find(mod => mod.key == data.module);
    if (!currentModule) {
        throw new errors.NotFoundError(`Did not find module [${data.module}] in course [${course.key}]`)
    }

    // create a new certification progress record
    const providerName = certification.providerName;
    const certificationName = certification.certification;
    console.log(`User [${userId}] is starting [${providerName}] certification [${certificationName}] now`)

    const modules = courseModules.map(module => {
        return {
            module: module.key,
            moduleStatus: module.key == data.module ? STATUS_IN_PROGRESS : STATUS_NOT_STARTED,
            lessonCount: module.lessons.length,
            completedLessonCount: 0,
            completedLessons: [],
            completedPercentage: 0
        }
    })

    const progress = {
        id: uuidv4(),
        userId: userId,
        provider: providerName,
        certification: certificationName,
        certificationId: certificationId,
        certType: certification.certType,
        courseKey: course.key,
        courseId: courseId,
        status: STATUS_IN_PROGRESS,
        academicHonestyPolicyAcceptedAt: new Date(),
        courseProgressPercentage: 0,
        startDate: new Date(),
        currentLesson: `${data.module}/${data.lesson}`,
        modules: modules
    }


    const newProgress = await helper.create('CertificationProgress', progress)
    decorateProgressCompletion(newProgress);

    return newProgress;
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
    decorateProgressCompletion(updatedProgress);

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
 * Get CertificationProgress by certification progress ID
 * 
 * @param {String} progressId the ID of the CertificationProgress 
 * @returns {Object} the certification progress for the given user and certification
 */
async function getCertificationProgress(progressId) {
    let progress = await helper.getById('CertificationProgress', progressId)

    decorateProgressCompletion(progress);

    return progress
}

getCertificationProgress.schema = {
    progressId: Joi.string()
}

/**
 * Delete CertificationProgress by certification progress ID
 * 
 * @param {String} progressId the ID of the CertificationProgress 
 * @returns {Object} the deleted CertificationProgress
 */
async function deleteCertificationProgress(progressId) {
    let progress = await helper.getById('CertificationProgress', progressId)

    await models.CertificationProgress.delete(progress)

    return progress
}

getCertificationProgress.schema = {
    progressId: Joi.string()
}

/**
 * Adds course and module completion progress information
 * 
 * @param {Object} progress the progress object to decorate
 */
function decorateProgressCompletion(progress) {
    if (!progress.modules) {
        return
    }

    progress.modules.forEach(module => {
        computeModuleProgress(module)
    })

    computeCourseProgress(progress)
}

/**
 * Computes module progress in terms of completed lessons and percent complete.
 * 
 * @param {Object} module course module to add progress information
 */
function computeModuleProgress(module) {
    const lessonCount = module.lessonCount || 0;
    const completedLessonCount = module.completedLessons.length || 0;
    module.completedLessonCount = completedLessonCount;

    let completedPercentage = 0;
    if (lessonCount > 0 && completedLessonCount > 0) {
        completedPercentage = Math.floor((completedLessonCount / lessonCount) * 100);
    }

    module.completedPercentage = completedPercentage;
}

/**
 * Computes overall course completion progress percentage
 * 
 * @param {Object} progress course progress object over which to compute progress
 */
function computeCourseProgress(progress) {
    let courseProgressPercentage = 0;
    let lessonCount = 0;
    let completedLessonCount = 0;

    // sum up the total number of lessons and completed lessons to compute
    // an overall completion percentage
    progress.modules.forEach(module => {
        lessonCount += module.lessonCount;
        completedLessonCount += module.completedLessonCount;
    })

    if (lessonCount > 0) {
        const rawCompletion = (completedLessonCount / lessonCount);
        courseProgressPercentage = Math.floor(rawCompletion * 100);

        // Round any non-zero value less than 1% completion up to 1% so we show the 
        // user some progress even if they've only completed a few lessons
        if (rawCompletion > 0 && courseProgressPercentage == 0) {
            courseProgressPercentage = 1
        }
    }

    progress.courseProgressPercentage = courseProgressPercentage;
}

/**
 * Decorates a collection of certification progresses with additional data
 * 
 * @param {Array} progresses an array of CertificationProgress objects
 */
function decorateProgresses(progresses) {
    progresses.forEach(progress => {
        decorateProgressCompletion(progress)
    })
}

/**
 * @param {String} certificationProgressId the ID of the certification progress record
 * @param {Object} data the course data containing the current module and lesson
 * @returns {Object} the updated course progress
 */
async function updateCurrentLesson(certificationProgressId, data) {
    console.log("** starting updateCurrentLesson for", certificationProgressId);

    validateWithSchema(updateCurrentLesson.schema, data)

    const progress = await getCertificationProgress(certificationProgressId);
    const module = data.module;
    const lesson = data.lesson;

    // Validate that the given module and lesson are correct for the 
    // certification/course. Will throw an error that is propagated back 
    // to the client if validation fails
    await validateCourseLesson(progress, module, lesson)

    const currentLesson = `${data.module}/${data.lesson}`
    const currentLessonData = {
        currentLesson: currentLesson
    }

    let updatedProgress = await helper.update(progress, currentLessonData)
    decorateProgressCompletion(updatedProgress);

    console.log(`Set current lesson for user ${progress.userId} to ${currentLesson}`)

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
 * Validates that the given module/lesson exist in the course 
 * 
 * @param {Object} progress the CertificationProgress object 
 * @param {String} moduleName the module name (key) to validate
 * @param {String} lessonName the lesson name to validate
 * @returns {Promise<void>} 
 */
async function validateCourseLesson(progress, moduleName, lessonName) {
    const provider = progress.provider;

    let course = helper.getFromInternalCache(progress.courseId);
    if (course == null) {
        console.log("cache miss looking up", progress.courseId);
        course = await helper.getById('Course', progress.courseId);
        helper.setToInternalCache(progress.courseId, course);
    }

    return new Promise((resolve, reject) => {
        const module = course.modules.find(mod => mod.key == moduleName)
        if (!module) {
            reject(new errors.NotFoundError(`Module '${moduleName}' not found in ${provider} course '${course.key}'`))
        }

        const lesson = module.lessons.find(less => less.dashedName == lessonName)
        if (!lesson) {
            reject(new errors.NotFoundError(`Lesson '${lessonName}' not found in ${provider} course '${course.key}' module '${moduleName}'`))
        }

        resolve(true)
    })
}

/**
 * Marks a lesson as complete in the Certification Progress
 * 
 * @param {String} certificationProgressId the certification progress Id
 * @param {Object} data the course data containing the module/lesson to complete
 * @returns {Object} the updated course progress
 */
async function completeLesson(certificationProgressId, data) {
    console.log("** starting completeLesson for", certificationProgressId);

    // Validate the data in the request
    const schema = Joi.object().keys(completeLesson.schema)
    const { error } = schema.validate({ data })
    if (error) {
        throw error
    }

    let progress = await getCertificationProgress(certificationProgressId);
    const userId = progress.userId;
    const certification = progress.certification;
    decorateProgressCompletion(progress)

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
        console.log(`User ${userId} has already completed ${certification}/${moduleName}/${lessonName}`);
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
        console.log(`User ${userId} completed ${certification}/${moduleName}/${lessonName}`);

        decorateProgressCompletion(updatedProgress);
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
 * Sets the timestamp of when the user accepted the academic honesty policy
 * 
 * @param {String} certificationProgressId the ID of the certification progress record
 * @returns {Object} the updated course progress
 */
async function acceptAcademicHonestyPolicy(certificationProgressId) {
    const progress = await getCertificationProgress(certificationProgressId);

    // No need to update if they've already accepted the policy, so just return 
    // the progress data
    if (progress.academicHonestyPolicyAcceptedAt) {
        return progress
    }

    // Create the update
    const acceptanceData = {
        academicHonestyPolicyAcceptedAt: new Date()
    }

    let updatedProgress = await helper.update(progress, acceptanceData)
    decorateProgressCompletion(updatedProgress);

    console.log(`User ${progress.userId} accepted the academic honesty policy for the ${progress.certification} certification`)

    return updatedProgress
}

module.exports = {
    acceptAcademicHonestyPolicy,
    completeCertification,
    completeLesson,
    deleteCertificationProgress,
    getCertificationProgress,
    searchCertificationProgresses,
    startCertification,
    updateCurrentLesson,
}
