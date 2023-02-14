/**
 * This service provides operations on FreeCodeCamp certification progress
 * data stored in Postgres.
 */

const db = require('../db/models');
const errors = require('../common/errors')
const imageGenerator = require('../utils/certificate-sharing/generate-certificate-image/GenerateCertificateImageService')

const { progressStatuses } = require('../common/constants');

const helper = require('../common/helper');

async function searchCertificationProgresses(query) {
    let options = {
        where: buildSearchWhere(query),
        include: certProgressIncludes()
    }

    try {
        let progresses = await db.FccCertificationProgress.findAll(options);
        decorateProgresses(progresses);

        return progresses;
    } catch (error) {
        console.error(error);
        return [];
    }
}

function buildSearchWhere(query) {
    let where = {
        userId: query.userId
    }

    if (query.certification) {
        where.certification = query.certification
    }
    if (query.certificationId) {
        where.fccCertificationId = query.certificationId
    }
    if (query.courseId) {
        where.fccCourseId = query.courseId
    }
    return where;
}

function certProgressIncludes() {
    return [
        {
            model: db.FccModuleProgress,
            as: 'moduleProgresses',
            include: {
                model: db.FccCompletedLesson,
                as: 'completedLessons',
                require: false
            }
        },
        // NOTE: including the ResourceProvider two different ways to see 
        // what the front-end devs prefer. The first one is straightforward 
        // to setup but nested, the second sets it as a top-level attribute
        // but is ugly to setup.
        {
            model: db.FreeCodeCampCertification,
            as: 'freeCodeCampCertification',
            include: {
                model: db.ResourceProvider,
                as: 'resourceProvider',
                attributes: ['id', 'name', 'description', 'attributionStatement', 'url']
            }
        },
        {
            model: db.ResourceProvider,
            as: 'resourceProvider',
            attributes: ['id', 'name', 'description', 'attributionStatement', 'url'],
            through: { attributes: [] }
        }
    ]
}

/**
 * Decorates a collection of certification progresses with additional data
 * 
 * @param {Array} progresses an array of FccCertificationProgress objects
 */
function decorateProgresses(progresses) {
    progresses.forEach(progress => {
        decorateProgressCompletion(progress)
    })
}

/**
 * Adds course and module completion progress information
 * 
 * @param {Object} progress the progress object to decorate
 */
function decorateProgressCompletion(progress) {
    if (!progress || !progress.moduleProgresses) {
        return
    }

    progress.moduleProgresses.forEach(module => {
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
    progress.moduleProgresses.forEach(module => {
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
    progress.moduleProgresses.filter(mod => mod.isAssessment).forEach(module => {
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
 * Sets the timestamp of when the user accepted the academic honesty policy
 * 
 * @param {Integer} certificationProgressId the ID of the certification progress record
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

    const updatedProgress = Object.assign(progress, acceptanceData);

    await progress.save()
    decorateProgressCompletion(updatedProgress);

    console.log(`User ${progress.userId} accepted the academic honesty policy for the ${progress.certification} certification`)

    return updatedProgress
}

/**
 * Get FccCertificationProgress by ID and user ID
 * 
 * @param {String} userId the ID of the user
 * @param {Integer} progressId the ID of the FCC certification progress record 
 * @returns {Object} the certification progress 
 */
async function getCertificationProgress(userId, progressId) {
    const options = {
        where: {
            userId: userId,
            id: progressId
        },
        include: certProgressIncludes()
    }
    let progress = await db.FccCertificationProgress.findOne(options)
    decorateProgressCompletion(progress);

    return progress
}

/**
 * Create a new certification progress record 
 * 
 * @param {String} userId the user's ID
 * @param {Object} query object containing the provier, certification, module and lesson the user has started
 * @returns {Object} the new FccCertificationProgress object, or the existing one for the certification
 */
async function startCertification(currentUser, userId, certificationId, courseId, query) {
    helper.ensureRequestForCurrentUser(currentUser, userId)

    let existingProgress = await getExistingProgress(userId, certificationId);

    if (existingProgress) {
        const provider = existingProgress.resourceProvider?.name;
        const certification = existingProgress.certification;

        // When the user enrolls in a Topcoder Certification a cert progress object 
        // will be created for each course in the cert, so it may exist but not yet 
        // be started -- handle that case here.
        if (existingProgress.isNotStarted()) {
            existingProgress = await existingProgress.start(query)
            console.log(`User ${userId} starting the ${provider} ${certification} certification now!`)
        } else {
            const startDate = existingProgress.startDate;
            console.log(`User ${userId} already started the ${provider} ${certification} certification on ${startDate}`)
        }

        // Ensure that if this FCC cert is part of a Topcoder Certification in which 
        // the user is enrolled that the CertResourceProgress status gets updated also.
        await db.CertificationResourceProgress.checkAndUpdateStatusFromResource(existingProgress)

        return existingProgress
    } else {
        const fccCertification = await db.FreeCodeCampCertification.findByPk(certificationId);
        let options = query;
        options.status = progressStatuses.inProgress;

        return await db.FccCertificationProgress.buildFromCertification(userId, fccCertification, options);
    }
}

async function getExistingProgress(userId, certificationId, courseId) {
    const searchCriteria = {
        userId: userId,
        certificationId: certificationId,
        courseId: courseId
    };

    results = await searchCertificationProgresses(searchCriteria);

    if (results.length > 1) {
        throw new errors.BadRequestError(`User ${userId} has multiple certification progresses for certification ID ${certificationId}`);
    }

    return results[0];
}

/**
 * @param {Integer} certificationProgressId the ID of the certification progress record
 * @param {Object} query the course data containing the current module and lesson
 * @returns {Object} the updated course progress
 */
async function updateCurrentLesson(currentUser, certificationProgressId, query) {
    const userId = currentUser.userId;

    const lessonId = query.lessonId;
    const module = query.module;
    const lesson = query.lesson;
    const currentLesson = `${module}/${lesson}`

    console.log(`User ${userId} setting current lesson to ${module}/${lesson}...`)

    // Get the FccCertProgress, FccLesson, and FccModule data
    const certProgress = await getCertificationProgress(userId, certificationProgressId);
    const fccLesson = await db.FccLesson.findByPk(lessonId, {
        include: {
            model: db.FccModule,
            as: 'fccModule'
        }
    })

    const fccModule = fccLesson.fccModule;

    // verify the module and lesson names correspond to the lesson ID before updating
    const moduleLessonMatch = (fccModule.key == module && fccLesson.dashedName == lesson)
    if (!moduleLessonMatch) {
        throw new errors.BadRequestError(
            `Module and lesson ${currentLesson} name don't match given FCC lesson ID ${lessonId}`)
    }

    // Module and lesson verified, get the module progress to update
    const moduleProgress = await certProgress.getModuleProgressForModule(fccModule.key);
    await moduleProgress.touchModule();
    let updatedProgress = await certProgress.updateCurrentLesson(currentLesson);
    decorateProgressCompletion(updatedProgress);

    console.log(`User ${certProgress.userId} set current lesson to ${currentLesson}`)

    return updatedProgress
}

/**
 * Marks a lesson as complete for an Fcc Certification Progress
 * 
 * @param {Integer} certificationProgressId the certification progress Id
 * @param {Object} data the course data containing the module/lesson to complete
 * @returns {Object} the updated course progress
 */
async function completeLesson(currentUser, certificationProgressId, query) {
    const userId = currentUser.userId;
    const module = query.module;
    const lesson = query.lesson;
    const lessonId = query.uuid;

    const certProgress = await getCertificationProgress(userId, certificationProgressId);
    await certProgress.completeLesson(module, lesson, lessonId);
    // fetch the full cert progress again to pickup all of the included assocations
    let updatedProgress = await getCertificationProgress(userId, certificationProgressId);
    decorateProgressCompletion(updatedProgress);

    console.log(`User ${userId} completed ${certProgress.certification}/${module}/${lesson} (id: ${lessonId})`);

    return updatedProgress
}

/**
 * Marks a lesson as complete in the FCC Certification Progress using data 
 * provided by a freeCodeCamp MongoDB update trigger.
 * 
 * @param {Object} query the input query describing the user and lesson
 */
async function completeLessonViaMongoTrigger(query) {
    const { userId, lessonId } = query;

    const fccLesson = await db.FccLesson.findByPk(lessonId);
    const fccModule = await fccLesson.getFccModule();
    const fccCourse = await fccModule.getFccCourse();
    const fccCertification = await fccCourse.getFccCertification();

    // where clause to find the matching Fcc Cert Progress record
    const where = {
        userId: userId,
        fccCertificationId: fccCertification.id
    }
    const certProgress = await db.FccCertificationProgress.findOne({
        where: where,
        include: certProgressIncludes()
    });

    if (certProgress) {
        const certification = certProgress.certification;
        const module = fccModule.key;
        const lesson = fccLesson.dashedName;
        await certProgress.completeLesson(module, lesson, lessonId);

        console.log(`User ${userId} completed ${certification}/${module}/${lesson} (id: ${lessonId}) (via MongoDB trigger)`);
    } else {
        console.error(`completeLessonViaMongoTrigger: could not find certification progress for user ${userId} for freeCodeCamp ${certification}`)
    }
}

/**
 * Delete the last completed lesson in a given module for the given certification 
 * 
 * @param {String} currentUser the user making the request
 * @param {Integer} progressId the ID of the CertificationProgress 
 * @param {String} module the dashed name key of the module
 * @returns {Object} the updated CertificationProgress
 */
async function deleteLastModuleLesson(currentUser, progressId, moduleName) {
    const userId = currentUser.userId;

    let progress = await getCertificationProgress(userId, progressId);
    const certification = progress.certification

    const modules = await progress.getModuleProgresses({
        where: {
            module: moduleName
        }
    })
    const targetModule = modules[0]

    // if we can't find the target module, bail out
    if (!targetModule) {
        console.error(`Did not find module ${moduleName} in ${certification}`)
        return progress;
    }

    // try to get the most recently completed lesson in the module progress
    const completedLessons = await targetModule.getCompletedLessons({
        order: [
            ['completedDate', 'DESC']
        ],
        limit: 1
    });

    const lastLesson = completedLessons[0]
    if (lastLesson) {
        console.log(`Deleting last completed lesson '${lastLesson.dashedName}' in ${certification}/${moduleName} for user ${userId}`);
        await lastLesson.destroy();
    } else {
        console.warn(`Could not get last lesson completed in ${certification}/${moduleName} for user ${userId}`)
    }

    return await getCertificationProgress(userId, progressId);
}

/**
 * Marks a certification as completed in the FCC Certification Progress record.
 * 
 * If the cert URL is present, this function will send a message to the queue to initiate the 
 * generation of an image for the cert.
 * 
 * @param {Integer} certificationProgressId the ID of the user's certification progress to complete
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

    await checkCertificateCompletion(progress)

    const userId = progress.userId;
    const providerName = progress.resourceProvider.name;
    const certification = progress.certification;

    const completedProgress = await progress.completeFccCertification();

    console.log(`User ${userId} has completed ${providerName} certification '${certification}'`);
    decorateProgressCompletion(completedProgress);

    // if we have the cert URL, generate the image
    if (!!certificateUrl) {
        console.log(`Generating certificate image for ${userId} for ${certification}`)
        imageGenerator.generateCertificateImage(
            progress,
            currentUser.nickname,
            certification,
            providerName,
            certificateUrl,
            certificateElement,
            certificateAlternateParams,
        )

    } else {
        console.log(`Certificate Image for ${userId} for ${certification} NOT being generated b/c no cert URL was provided.`)
    }

    return completedProgress
}

/**
 * Checks if all of the assessments required for an FCC certification
 * have been completed
 * 
 * @param {Object} module the module to check for completion
 */
async function checkCertificateCompletion(progress) {
    const userId = progress.userId;

    // if any assessment module has not been completed, throw an error that 
    // will be returned to the caller as a non-success HTTP code 
    const allAssessmentsCompleted = await progress.allAssessmentModulesCompleted();

    if (!allAssessmentsCompleted) {
        throw new errors.BadRequestError(
            `User ${userId} has not completed all required assessment modules for the ${progress.certificationTitle} certification`)
    } else {
        return true
    }
}

/**
 * Delete FccCertificationProgress by ID
 * 
 * @param {String} currentUser the user making the request
 * @param {String} progressId the ID of the CertificationProgress 
 * @returns {Object} the deleted CertificationProgress
 */
async function deleteCertificationProgress(currentUser, progressId) {
    let progress = await getCertificationProgress(currentUser.userId, progressId);
    if (progress) {
        await progress.destroy()
    }
    return progress
}

module.exports = {
    acceptAcademicHonestyPolicy,
    completeCertification,
    completeLesson,
    completeLessonViaMongoTrigger,
    deleteCertificationProgress,
    deleteLastModuleLesson,
    getCertificationProgress,
    searchCertificationProgresses,
    startCertification,
    updateCurrentLesson,
}
