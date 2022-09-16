/**
 * This service provides operations on Learning Path certification progress.
 */

const _ = require('lodash')
const { CertificationProgress } = require('../models')
const errors = require('../common/errors')
const helper = require('../common/helper')
const Joi = require('joi')
const logger = require('../common/logger')
const models = require('../models')
const { v4: uuidv4 } = require('uuid')
const { performance } = require('perf_hooks');
const imageGenerator = require('../utils/certificate-image-generator/GenerateCertificateImageService')
const fccService = require('./FreeCodeCampDataService');

const STATUS_COMPLETED = "completed";
const STATUS_IN_PROGRESS = "in-progress";
const STATUS_NOT_STARTED = "not-started";

const LESSON_COMPLETING_MUTEX = "lesson_completing"
const MUTEX_TTL = 2 // seconds

/**
 * Search Certification Progress
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCertificationProgresses(criteria) {
    const startTime = performance.now()

    records = await helper.scanAll('CertificationProgress')
    const endScanTime = performance.now()
    helper.logExecutionTime(startTime, endScanTime, `scanAll CertificationProgress`);

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

    const endTime = performance.now()
    helper.logExecutionTime(startTime, endTime, 'searchCertificationProgresses', true)

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
 * @param {Object} query object containing the provier, certification, module and lesson the user has started
 * @returns {Object} the new CertificationProgress object, or the existing one for the certification
 */
async function startCertification(currentUser, userId, certificationId, courseId, query) {
    helper.ensureRequestForCurrentUser(currentUser, userId)

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

        console.log(`User ${userId} already started the ${provider} ${certification} certification on ${startDate}`)
        return existingProgress
    } else {
        return await buildNewCertificationProgress(userId, certificationId, courseId, query);
    }
}

startCertification.schema = {
    userId: Joi.string(),
    certificationId: Joi.string(),
    courseId: Joi.string(),
    query: Joi.object().keys({
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
 * @param {Object} query the module and lesson in the course on which the user is starting
 * @returns 
 */
async function buildNewCertificationProgress(userId, certificationId, courseId, query) {
    // next call will throw and return an error if the certificationId doesn't exist,
    // so just let that happen since the API will return the error to the client
    const certification = await helper.getById('Certification', certificationId);
    validateQueryWithSchema(startCertification.schema, query);

    const course = await helper.getById('Course', courseId);
    const courseModules = course.modules;
    const currentModule = courseModules.find(mod => mod.key == query.module);
    if (!currentModule) {
        throw new errors.NotFoundError(`Did not find module [${query.module}] in course [${course.key}]`)
    }

    // create a new certification progress record
    const provider = await helper.getById('LearningResourceProvider', certification.providerId);

    const certificationName = certification.certification;
    console.log(`User ${userId} starting ${provider.name} certification ${certificationName} now`)

    const modules = courseModules.map(module => {
        return {
            module: module.key,
            moduleStatus: module.key == query.module ? STATUS_IN_PROGRESS : STATUS_NOT_STARTED,
            lessonCount: module.lessons.length,
            completedLessonCount: 0,
            completedLessons: [],
            completedPercentage: 0
        }
    })

    const progress = {
        id: uuidv4(),
        userId: userId,
        providerId: provider.id,
        provider: provider.name,
        providerUrl: provider.url,
        certificationId: certificationId,
        certification: certificationName,
        certificationTitle: certification.title,
        certificationTrackType: certification.trackType,
        certType: certification.certType,
        courseKey: course.key,
        courseId: courseId,
        status: STATUS_IN_PROGRESS,
        academicHonestyPolicyAcceptedAt: new Date(),
        courseProgressPercentage: 0,
        startDate: new Date(),
        currentLesson: `${query.module}/${query.lesson}`,
        modules: modules
    }

    const newProgress = await helper.create('CertificationProgress', progress)
    decorateProgressCompletion(newProgress);

    return newProgress;
}

/**
 * Marks a certification as completed in the Certification Progress record.
 * 
 * If the cert URL is present, this function will send a message to the queue to initiate the 
 * generation of an image for the cert.
 * 
 * @param {String} certificationProgressId the ID of the user's certification progress to complete
 * @param {Object} data the course data containing the current module and lesson
 * @returns {Object} the updated course progress
 * @param {String} certificateUrl (optional) the URL at which the cert should be visible
 * @param {String} certificateElement (optional) the element w/in the cert that should be used for
 * image generation
 */
async function completeCertification(
    currentUser,
    certificationProgressId,
    certificateUrl,
    certificateElement
) {

    const progress = await getCertificationProgress(currentUser, certificationProgressId);

    checkCertificateCompletion(currentUser, progress)

    const userId = progress.userId;
    const provider = progress.provider;
    const certification = progress.certification;

    const completionData = {
        completedDate: new Date(),
        status: STATUS_COMPLETED
    }

    const updatedProgress = await helper.update(progress, completionData)
    console.log(`User ${userId} has completed ${provider} certification '${certification}'`);
    decorateProgressCompletion(updatedProgress);

    // if we have the cert URL, generate the image
    if (!!certificateUrl) {

        console.log(`Generating certificate image for ${userId} for ${certification}`)
        imageGenerator.generateCertificateImage(certification, currentUser.nickname, certificateUrl, certificateElement, progress)

    } else {
        console.log(`Certificate Image for ${userId} for ${certification} NOT being generated bc no cert URL was provided.`)
    }

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
 * Checks and sets the module status as follows:
 *   - if one or more assessment lessons are completed, but not all, it's set to 'in-progress'
 *   - if all of the assessment lessons have been completed, it's set to 'completed'
 * 
 * @param {Object} module the module to check for completion
 */
function checkCertificateCompletion(user, progress) {
    // if any assessment module has not been completed, throw an error that 
    // will be returned to the caller as a non-success HTTP code 
    const notCompleted = progress.modules.some(module => {
        return assessmentModuleNotCompleted(module);
    });

    if (notCompleted) {
        throw new errors.BadRequestError(
            `User ${user.userId} has not completed all required assessment modules for the ${progress.certificationTitle}`)
    } else {
        return true
    }
}

/**
 * Checks if a module is an assessment and has not been completed
 * 
 * @param {Object} module a Module object
 * @returns true if a module is an assessment and has not been completed    
 */
function assessmentModuleNotCompleted(module) {
    if (isAssessmentModule(module)) {
        return module.moduleStatus != STATUS_COMPLETED
    } else {
        return false
    }
}

/**
 * TODO: this check should use a module attribute that is set when the course
 * data is imported and is non-provider specific.
 * 
 * Checks if a module is an assessment, which is required to be completed
 * to earn a certification.
 * 
 * @param {Object} module a Module object
 * @returns true if the module is an assessment module
 */
function isAssessmentModule(module) {
    return module.lessonCount == 1
}

/**
 * TODO: if this type of check is required it should be pulled out into 
 * a provider-specific module and then exposed as a generic "checkCourseCompletion"
 * method or something along those lines.
 * 
 * This method is currently unused and could be removed, keeping it here as a 
 * reminder of the logic we considered to verify course completion by comparing the 
 * provider's data with our own course progress metadata.
 * 
 * Verifies that the user has completed all of the lessons required to 
 * earn a FreeCodeCamp certification by comparing our CertificationProgress 
 * completed lesson data with the lesson completion data in the user's 
 * FreeCodeCamp application record.
 * 
 * @param {Object} user 
 * @param {Object} progress CertificationProgress object
 */
async function verifyFCCCourseCompletion(user, progress) {
    const query = { email: user.email };
    const fccUserRecord = await fccService.findUser(query);

    console.log("fccUserRecord", fccUserRecord);

    if (!fccUserRecord) {
        throw new errors.BadRequestError(
            `User ${user.userId} (${user.email}) was not found in the freeCodeCamp data`)
    }

    throw "TEST"
}

function validateQueryWithSchema(modelSchema, query) {
    const schema = Joi.object().keys(modelSchema)
    const { error } = schema.validate({ query })
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
async function getCertificationProgress(currentUser, progressId) {
    // testing performance 
    var startTime = performance.now()

    let progress = await helper.getByIdAndUser('CertificationProgress', progressId, currentUser.userId)
    decorateProgressCompletion(progress);

    // testing performance
    var endTime = performance.now()
    helper.logExecutionTime(startTime, endTime, 'getCertificationProgress')

    return progress
}

getCertificationProgress.schema = {
    progressId: Joi.string()
}

/**
 * Delete CertificationProgress by certification progress ID
 * 
 * @param {String} currentUser the user making the request
 * @param {String} progressId the ID of the CertificationProgress 
 * @returns {Object} the deleted CertificationProgress
 */
async function deleteCertificationProgress(currentUser, progressId) {
    let progress = await helper.getByIdAndUser('CertificationProgress', progressId, currentUser.userId)

    if (progress) {
        await models.CertificationProgress.delete(progress)
    }
    return progress
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
    // testing performance 
    // var startTime = performance.now()

    const lessonCount = module.lessonCount || 0;
    const completedLessonCount = module.completedLessons.length || 0;
    module.completedLessonCount = completedLessonCount;

    let completedPercentage = 0;
    if (lessonCount > 0 && completedLessonCount > 0) {
        completedPercentage = Math.floor((completedLessonCount / lessonCount) * 100);
    }

    module.completedPercentage = completedPercentage;

    // testing performance
    // var endTime = performance.now()
    // helper.logExecutionTime(startTime, endTime, 'computeModuleProgress')
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
 * @param {Object} query the course data containing the current module and lesson
 * @returns {Object} the updated course progress
 */
async function updateCurrentLesson(currentUser, certificationProgressId, query) {
    const module = query.module;
    const lesson = query.lesson;

    console.log(`User ${currentUser.userId} setting current lesson to ${module}/${lesson}...`)

    // testing performance 
    var startTime = performance.now()

    validateQueryWithSchema(updateCurrentLesson.schema, query)

    // TODO: placeholder in case we need to implement some sort of 
    //       mutex to prevent overwriting progress updates. This code, 
    //       as currently written, does not work, but I'm keeping it
    //       to remind myself where I left off in this effort.
    //
    // check the mutex that indicates that a lesson completion update is in progress
    // let mutexSet = true; //isMutexSet(certificationProgressId, LESSON_COMPLETING_MUTEX);
    // let check = 0
    // if (mutexSet) {
    //     var intervalId = setInterval(() => {
    //         console.log("** mutex checks", check)
    //         if (++check > 10) {
    //             clearInterval(intervalId);
    //         }
    //     }, 100)
    // }

    const progress = await getCertificationProgress(currentUser, certificationProgressId);
    const moduleIndex = progress.modules.findIndex(mod => mod.module == module)

    if (moduleIndex != -1) {
        const lastCompletedLesson = _.last(progress.modules[moduleIndex].completedLessons)
        if (lastCompletedLesson) {
            console.log(`User ${progress.userId} last completed lesson was ${lastCompletedLesson.dashedName}`)
        }
    }

    // Validate that the given module and lesson are correct for the 
    // certification/course. Will throw an error that is propagated back 
    // to the client if validation fails

    // testing performance 
    var startTimeValidate = performance.now()
    await validateCourseLesson(progress, module, lesson)
    // testing performance
    var endTimeValidate = performance.now()
    helper.logExecutionTime(startTimeValidate, endTimeValidate, 'validateCourseLesson')

    const currentLesson = `${query.module}/${query.lesson}`
    const currentLessonData = {
        currentLesson: currentLesson
    }

    // create a composite id key for the update
    const idObj = {
        id: certificationProgressId,
        certification: progress.certification
    }
    let updatedProgress = await helper.updateAtomic("CertificationProgress", idObj, currentLessonData)
    decorateProgressCompletion(updatedProgress);

    // testing performance
    var endTime = performance.now()
    helper.logExecutionTime(startTime, endTime, 'updateCurrentLesson', true)

    console.log(`User ${progress.userId} set current lesson to ${currentLesson}`)

    return updatedProgress
}

updateCurrentLesson.schema = {
    certificationProgressId: Joi.string(),
    query: Joi.object().keys({
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
    // console.log(`Validating lesson ${moduleName}/${lessonName}`)

    const provider = progress.provider;

    let course = helper.getFromInternalCache(progress.courseId)
    if (!course) {
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
async function completeLesson(currentUser, certificationProgressId, query) {

    const moduleName = query.module;
    const lessonName = query.lesson;
    const uuid = query.uuid;

    console.log(`User ${currentUser.userId} completing lesson ${moduleName}/${lessonName}...`)

    const startTime = performance.now()

    // Validate the data in the request
    const schema = Joi.object().keys(completeLesson.schema)
    const { error } = schema.validate({ query })
    if (error) {
        throw error
    }

    let progress = await getCertificationProgress(currentUser, certificationProgressId);
    const userId = progress.userId;
    const certification = progress.certification;

    const moduleIndex = progress.modules.findIndex(mod => mod.module == moduleName)
    if (moduleIndex == -1) {
        throw `Module '${moduleName}' not found in certification '${certification}'`
    }

    const lesson = progress.modules[moduleIndex].completedLessons.find(
        lesson => lesson.dashedName == lessonName)

    if (lesson) {
        // it's already been completed, so just log it and return the current progress object
        console.log(`User ${userId} previously completed lesson ${certification}/${moduleName}/${lessonName}`);
        decorateProgressCompletion(progress)
        return progress
    } else {
        const completedLesson = {
            id: uuid,
            dashedName: lessonName,
            completedDate: new Date()
        }
        progress.modules[moduleIndex].completedLessons.push(completedLesson)

        // checks to see if the module has been completed and marks it accordingly
        checkAndSetModuleStatus(userId, progress.modules[moduleIndex])

        const updatedModules = {
            modules: progress.modules
        }

        const idObj = {
            id: certificationProgressId,
            certification: progress.certification
        }
        let updatedProgress = await helper.updateAtomic("CertificationProgress", idObj, updatedModules);

        decorateProgressCompletion(updatedProgress);

        const endTime = performance.now()
        helper.logExecutionTime(startTime, endTime, 'completeLesson')

        console.log(`User ${userId} completed ${certification}/${moduleName}/${lessonName}`);

        return updatedProgress
    }
}

completeLesson.schema = {
    certificationProgressId: Joi.string(),
    query: Joi.object().keys({
        module: Joi.string().required(),
        lesson: Joi.string().required(),
        uuid: Joi.string()
    }).required()
}

// A set of helper functions used to see if we can institute a 
// poor dev's version of a mutex to deconflict DB actions that seem 
// to be causing issues
function setMutex(progressId, mutex) {
    console.log(`setting mutex for ${progressId} to ${mutex}`)
    helper.setToInternalCache(cacheKey(progressId), mutex, MUTEX_TTL)
}

function isMutexSet(progressId, mutex) {
    console.log(`checking mutex for ${progressId}`)
    return mutex === helper.getFromInternalCache(cacheKey(progressId))
}

function clearMutex(progressId) {
    setMutex(progressId, null)
}

/**
 * Creates a key used to write/read cache values for the progress record
 * 
 * @param {String} progressId 
 * @returns String cache key
 */
function cacheKey(progressId) {
    return `certification-progress-${progressId}`
}

/**
 * Checks and sets the module status as follows:
 *   - if one or more lessons are completed, but not all, it's set to 'in-progress'
 *   - if all of the lessons have been completed, it's set to 'completed'
 * 
 * @param {Object} module the module to check for completion
 */
function checkAndSetModuleStatus(userId, module) {
    const moduleInProgress = (module.completedLessons.length < module.lessonCount)
    const moduleCompleted = (module.completedLessons.length == module.lessonCount)

    if (moduleInProgress) {
        // console.log(`User ${userId} started module ${module.module}`)
        module.moduleStatus = STATUS_IN_PROGRESS
    } else if (moduleCompleted) {
        // console.log(`User ${userId} completed module ${module.module}`)
        module.moduleStatus = STATUS_COMPLETED
    }
}

/**
 * Sets the timestamp of when the user accepted the academic honesty policy
 * 
 * @param {String} certificationProgressId the ID of the certification progress record
 * @returns {Object} the updated course progress
 */
async function acceptAcademicHonestyPolicy(currentUser, certificationProgressId) {
    const progress = await getCertificationProgress(currentUser, certificationProgressId);

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
