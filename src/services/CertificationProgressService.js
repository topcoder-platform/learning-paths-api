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
const imageGenerator = require('../utils/certificate-sharing/generate-certificate-image/GenerateCertificateImageService')
const courseService = require('./CourseService');

const STATUS_COMPLETED = "completed";
const STATUS_IN_PROGRESS = "in-progress";
const STATUS_NOT_STARTED = "not-started";

const PROVIDER_FREECODECAMP = "freeCodeCamp";

async function searchCertificationProgresses(query) {
    const userId = query.userId;

    let queryStatement = CertificationProgress.
        query("userId").eq(userId).
        using("userCertificationProgressIndex")

    if (query.certification) {
        queryStatement = queryStatement.where("certification").eq(query.certification)
    }
    if (query.certificationId) {
        queryStatement = queryStatement.where("certificationId").eq(query.certificationId)
    }
    if (query.provider) {
        queryStatement = queryStatement.where("provider").eq(query.provider)
    }
    if (query.courseId) {
        queryStatement = queryStatement.where("courseId").eq(query.courseId)
    }

    try {
        let progresses = await queryStatement.exec();
        decorateProgresses(progresses);

        return progresses;
    } catch (error) {
        console.error(error);
        return [];
    }
}

// TODO - modify and use this schema to verify the input request
// searchCertificationProgresses.schema = {
//     criteria: Joi.object().keys({
//         page: Joi.page(),
//         perPage: Joi.number().integer().min(1).max(100).default(100),
//         userId: Joi.string(),
//         certification: Joi.string(),
//         provider: Joi.string(),
//     })
// }

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
        if (results.length > 1) {
            throw new errors.BadRequestError(`User ${userId} has multiple certification progresses for certification ID ${certificationId}`)
        }
        existingProgress = results[0];
    } catch (NotFoundError) {
        // no-op, just means they haven't started this certification yet
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
        let progressModule = {
            module: module.key,
            moduleStatus: module.key == query.module ? STATUS_IN_PROGRESS : STATUS_NOT_STARTED,
            isAssessment: module.meta.isAssessment,
            lessonCount: module.lessons.length,
            completedLessonCount: 0,
            completedLessons: [],
            completedPercentage: 0
        }

        // set the module start date
        if (module.key == query.module) {
            progressModule.startDate = new Date()
        }

        return progressModule;
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
  * @param {Object} certificateAlternateParams (optional) If there are any alternate params,
 * they will be added to the list of image files that will be created.
 */
async function completeCertification(
    currentUser,
    certificationProgressId,
    certificateUrl,
    certificateElement,
    certificateAlternateParams,
) {

    const progress = await getCertificationProgress(currentUser.userId, certificationProgressId);

    checkCertificateCompletion(progress)

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
        imageGenerator.generateCertificateImage(
            progress,
            currentUser.nickname,
            certification,
            provider,
            certificateUrl,
            certificateElement,
            certificateAlternateParams,
        )

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
function checkCertificateCompletion(progress) {
    const userId = progress.userId;

    // if any assessment module has not been completed, throw an error that 
    // will be returned to the caller as a non-success HTTP code 
    const notCompleted = progress.modules.some(module => {
        return assessmentModuleNotCompleted(module);
    });

    if (notCompleted) {
        throw new errors.BadRequestError(
            `User ${userId} has not completed all required assessment modules for the ${progress.certificationTitle}`)
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
 * Checks if a module is an assessment, which is required to be completed
 * to earn a certification.
 * 
 * TODO: morphing this method to use an explicit +isAssessment+ property 
 * of modules if available, otherwise fallback to checking the number of
 * lessons in the module. Clean this up once we have updated all of the 
 * existing data to contain the new property.
 * 
 * @param {Object} module a Module object
 * @returns true if the module is an assessment module
 */
function isAssessmentModule(module) {
    if (module.hasOwnProperty('isAssessment')) {
        return module.isAssessment;
    } else {
        return module.lessonCount == 1
    }
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
async function getCertificationProgress(userId, progressId) {
    let progress = await helper.getByIdAndUser('CertificationProgress', progressId, userId)
    decorateProgressCompletion(progress);

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
 * Delete the last completed lesson in a given module for the given certification 
 * 
 * @param {String} currentUser the user making the request
 * @param {String} progressId the ID of the CertificationProgress 
 * @param {String} module the dashed name key of the module
 * @returns {Object} the updated CertificationProgress
 */
async function deleteLastModuleLesson(currentUser, progressId, moduleName) {
    const userId = currentUser.userId;
    let progress = await helper.getByIdAndUser('CertificationProgress', progressId, userId)

    const certification = progress.certification
    console.log(`Deleting last lesson in ${certification}/${moduleName} for user ${userId}`)

    targetModule = progress.modules.find(module => module.module == moduleName)

    if (targetModule) {
        lessons = targetModule.completedLessons
        if (!_.isEmpty(lessons)) {
            progress = await deleteModuleLesson(progress, targetModule);
        } else {
            console.log(`No completed lessons found in ${certification}/${moduleName}`)
        }
    } else {
        console.error(`Did not find module ${moduleName} in ${certification}`)
    }

    return progress
}

/**
 * Removes the last lesson in a given module in the given CertProgress record. Sets 
 * the certification progress and module statuses to 'in-progress'.
 * 
 * @param {Object} progress CertificationProgress record
 * @param {Object} targetModule the module from which the lesson is to be removed
 * @returns the updated CertProgress record
 */
async function deleteModuleLesson(progress, targetModule) {
    const lastLesson = targetModule.completedLessons.pop()
    const lessonName = lastLesson.dashedName;

    const idObj = {
        id: progress.id,
        certification: progress.certification
    }

    targetModule.moduleStatus = 'in-progress'
    const updatedModules = {
        status: 'in-progress',
        modules: progress.modules
    }

    let updatedProgress = await helper.updateAtomic("CertificationProgress", idObj, updatedModules)
    if (updatedProgress) {
        console.log(`Deleted lesson ${progress.certification}/${targetModule.module}/${lessonName}`)
        decorateProgressCompletion(updatedProgress);

        return updatedProgress
    }
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
    computeCertificationProgress(progress)
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
 * Computes overall certification (assessment) completion progress percentage
 * and decorates the progress object with that computed value.
 * 
 * @param {Object} progress certification progress object over which to compute progress
 */
function computeCertificationProgress(progress) {
    let certificationProgressPercentage = 0;
    let assessmentCount = 0;
    let completedAssessmentCount = 0;

    // sum up the total number of assessments and completed assessments to compute
    // an overall completion percentage. NOTE: this assumes all lessons in an 
    // assessment module are assessment lessons, which has been true for every 
    // FCC course we've imported.
    progress.modules.filter(mod => mod.isAssessment).forEach(module => {
        assessmentCount += module.lessonCount;
        completedAssessmentCount += module.completedLessonCount;
    })

    if (assessmentCount > 0) {
        const rawCompletion = (completedAssessmentCount / assessmentCount);
        certificationProgressPercentage = Math.floor(rawCompletion * 100);

        // Round any non-zero value less than 1% completion up to 1% so we show the 
        // user some progress even if they've only completed a few lessons
        if (rawCompletion > 0 && certificationProgressPercentage == 0) {
            certificationProgressPercentage = 1
        }
    }

    progress.certificationProgressPercentage = certificationProgressPercentage;
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

    validateQueryWithSchema(updateCurrentLesson.schema, query)

    const progress = await getCertificationProgress(currentUser.userId, certificationProgressId);

    // Set the module start date if it hasn't already been started. Set the 
    // module status to in-progress, too.
    const moduleIndex = progress.modules.findIndex(mod => mod.module == module)
    if (moduleIndex != -1) {
        if (!progress.modules[moduleIndex].startDate) {
            progress.modules[moduleIndex].startDate = new Date()
        }

        if (progress.modules[moduleIndex].moduleStatus == STATUS_NOT_STARTED) {
            progress.modules[moduleIndex].moduleStatus = STATUS_IN_PROGRESS
        }
    }

    // Validate that the given module and lesson are correct for the 
    // certification/course. Will throw an error that is propagated back 
    // to the client if validation fails

    // TODO: Commenting this out temporarily to account for lesson IDs that have changed 
    // in the freeCodeCamp source that have not been propagated to the DynamoDB course 
    // data yet.

    // create a composite id key for the update
    const idObj = {
        id: certificationProgressId,
        certification: progress.certification
    }

    // set the data to update
    const currentLesson = `${query.module}/${query.lesson}`
    const currentLessonAndModuleData = {
        currentLesson: currentLesson,
        modules: progress.modules
    }

    let updatedProgress = await helper.updateAtomic("CertificationProgress", idObj, currentLessonAndModuleData)
    decorateProgressCompletion(updatedProgress);

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
 * Marks a lesson as complete in the Certification Progress
 * 
 * @param {String} certificationProgressId the certification progress Id
 * @param {Object} data the course data containing the module/lesson to complete
 * @returns {Object} the updated course progress
 */
async function completeLesson(currentUser, certificationProgressId, query) {
    const userId = currentUser.userId;
    const moduleName = query.module;
    const lessonName = query.lesson;
    const lessonId = query.uuid;

    // console.log(`User ${userId} completing lesson ${moduleName}/${lessonName}, id ${lessonId}`)

    // Validate the data in the request
    const schema = Joi.object().keys(completeLesson.schema)
    const { error } = schema.validate({ query })
    if (error) {
        throw error
    }

    const updatedProgress = await setLessonComplete(userId, certificationProgressId, moduleName, lessonName, lessonId);

    return updatedProgress
}

completeLesson.schema = {
    certificationProgressId: Joi.string(),
    query: Joi.object().keys({
        module: Joi.string().required(),
        lesson: Joi.string().required(),
        uuid: Joi.string()
    }).required()
}

/**
 * Sets a lesson as complete within a CertificationProgress record 
 * 
 * @param {String} userId unique user ID
 * @param {String} certificationProgressId unique certification progress ID
 * @param {String} moduleName name of module containing the completed lesson
 * @param {String} lessonName name of lesson that was completed
 * @param {String} lessonId unique ID of lesson that was completed
 * @returns updated CertificationProgress object
 */
async function setLessonComplete(userId, certificationProgressId, moduleName, lessonName, lessonId) {
    let progress = await getCertificationProgress(userId, certificationProgressId);
    const { certification, moduleIndex, lesson } = resolveCertificationModuleLesson(progress, moduleName, lessonId)

    if (lesson) {
        // it's already been completed, so just log it and return the current progress object
        console.log(`User ${userId} completed lesson ${certification}/${moduleName}/${lessonName} (id: ${lessonId}), skipping Mongo update`);
        decorateProgressCompletion(progress)
        return progress
    } else {
        return await updateCompletedLessonNative(progress, moduleIndex, moduleName, lessonId, lessonName)
    }
}

/**
 * A helper function that looks for a completed module and lesson in a  
 * CertificationProgress record.
 * 
 * The returned lesson can be null if it hasn't been completed yet.
 * 
 * @param {Object} progress CertificationProgress object
 * @param {String} moduleName name of the module to resolve
 * @param {String} lessonId ID of the lesson to resolve
 * @returns an object containing the resolved certification name, 
 *      module index, and lesson (or null)
 */
function resolveCertificationModuleLesson(progress, moduleName, lessonId) {
    const certification = progress.certification;

    const moduleIndex = progress.modules.findIndex(mod => mod.module == moduleName)
    if (moduleIndex == -1) {
        throw `Module '${moduleName}' not found in certification '${certification}'`
    }

    const lesson = progress.modules[moduleIndex].completedLessons.find(
        lesson => lesson.id == lessonId)

    return { certification, moduleIndex, lesson }
}

/**
 * Uses a native AWS DynamoDB SDK call (via helper method) to update a Certification 
 * Progress record with a completed lesson.
 * 
 * @param {Object} progress the CertificationProgress record to update
 * @param {Integer} moduleIndex the index of the module to update in the array of modules
 * @param {String} lessonId the ID of the lesson that was completed
 * @param {String} lessonName the name of the lesson that was completed
 * @returns a CertificationProgress record updated with the completed lesson
 */
async function updateCompletedLessonNative(progress, moduleIndex, moduleName, lessonId, lessonName) {
    const { userId, certification } = progress;

    const completedLesson = {
        id: lessonId,
        dashedName: lessonName,
        completedDate: Date.now()
    }
    progress.modules[moduleIndex].completedLessons.push(completedLesson)

    // checks to see if the module has been completed and marks it accordingly
    checkAndSetModuleStatus(progress.modules[moduleIndex])
    const moduleStatus = progress.modules[moduleIndex].moduleStatus

    // setup the object that identifies the record to update
    const keyFields = {
        partitionKey: {
            key: 'id',
            value: progress.id
        },
        sortKey: {
            key: 'certification',
            value: progress.certification
        }
    }

    // set up the object that contains the update
    const updateObj = {
        itemIndex: moduleIndex,
        moduleStatus: moduleStatus,
        addItem: completedLesson
    }

    const updatedProgress = await helper.addCompletedLessonNative(keyFields, updateObj);
    decorateProgressCompletion(updatedProgress);

    console.log(`User ${userId} completed ${certification}/${moduleName}/${lessonName} (id: ${lessonId})`);

    return updatedProgress
}

/**
 * Marks a lesson as complete in the Certification Progress using data 
 * provided by a freeCodeCamp MongoDB update trigger.
 * 
 * @param {Object} query the input query describing the user and lesson
 */
async function completeLessonViaMongoTrigger(query) {
    // get the lesson map to lookup the lesson ID
    const courseLessonMap = await courseService.getCourseLessonMap(PROVIDER_FREECODECAMP);
    const { userId, lessonId } = query;

    // if we can't get the course lesson map for this provider, bail out
    if (!courseLessonMap) {
        console.error(`completeLessonViaMongoTrigger: error getting freeCodeCamp course lesson map`);
        return;
    }

    const lesson = courseLessonMap[lessonId]
    // if we can't find the map for the given lesson ID, bail out
    if (!lesson) {
        console.error(`completeLessonViaMongoTrigger: could not find freeCodeCamp lesson id ${lessonId}`);
        return;
    }

    // search the certification progress table for a matching progress record
    const certification = lesson.certification;
    const criteria = {
        provider: PROVIDER_FREECODECAMP,
        userId: userId,
        certification: certification
    }

    const { dashedName, moduleKey } = lesson;
    const result = await searchCertificationProgresses(criteria);

    // if we found a progress record, set the lesson as complete, otherwise bail out
    if (!!result && !!result[0]) {
        const certProgress = result[0];
        const certProgressId = certProgress.id;
        await setLessonComplete(userId, certProgressId, moduleKey, dashedName, lessonId);
        console.log(`called complete lesson ${moduleKey}/${dashedName} (id: ${lessonId}) for user ${userId} via MongoDB trigger`)
    } else {
        console.error(`completeLessonViaMongoTrigger: could not find certification progress for user ${userId} for freeCodeCamp ${certification}`)
    }
}

/**
 * Checks and sets the module status as follows:
 *   - if a module has been completed already, it simply returns
 *   - if one or more lessons have been completed, but not all of them, 
 *     it's set to 'in-progress'
 *   - if all of the lessons have been completed, it's set to 'completed'
 * 
 * @param {Object} module the module to check for completion
 */
function checkAndSetModuleStatus(module) {
    if (module.moduleStatus == STATUS_COMPLETED) return;

    const completedLessonCount = module.completedLessons.length;
    const moduleInProgress = ((completedLessonCount > 0) && (completedLessonCount < module.lessonCount))
    // Using >= in the following check for cases where a lesson has been added
    // to a module after the progress record was initially created. In that case 
    // the original lessonCount can be less than the total number of lessons 
    // the user completes. TODO: this should probably be addressed when an FCC 
    // course update is performed by updating the module lessonCount for all certifications
    // that have not been completed.
    const moduleCompleted = (completedLessonCount >= module.lessonCount)

    if (moduleInProgress) {
        module.moduleStatus = STATUS_IN_PROGRESS
    } else if (moduleCompleted) {
        module.moduleStatus = STATUS_COMPLETED
        if (!module.completedDate) {
            module.completedDate = new Date()
        }
    }
}

/**
 * Sets the timestamp of when the user accepted the academic honesty policy
 * 
 * @param {String} certificationProgressId the ID of the certification progress record
 * @returns {Object} the updated course progress
 */
async function acceptAcademicHonestyPolicy(currentUser, certificationProgressId) {
    const progress = await getCertificationProgress(currentUser.userId, certificationProgressId);

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

async function getCompletedLessonIds(userId, progressId) {
    const certProgress = await getCertificationProgress(userId, progressId);
    return mapCompletedLessonIds(certProgress);
}

function mapCompletedLessonIds(certProgress) {
    let completedLessonIds = [];
    certProgress.modules.forEach(module => {
        module.completedLessons.forEach(lesson => {
            completedLessonIds.push(lesson.id);
        })
    });

    return completedLessonIds;
}

module.exports = {
    acceptAcademicHonestyPolicy,
    assessmentModuleNotCompleted,
    checkAndSetModuleStatus,
    checkCertificateCompletion,
    completeCertification,
    completeLesson,
    completeLessonViaMongoTrigger,
    deleteCertificationProgress,
    deleteLastModuleLesson,
    getCertificationProgress,
    getCompletedLessonIds,
    mapCompletedLessonIds,
    searchCertificationProgresses,
    setLessonComplete,
    startCertification,
    updateCurrentLesson
}
