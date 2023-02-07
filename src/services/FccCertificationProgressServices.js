/**
 * This service provides operations on FreeCodeCamp certification progress
 * data stored in Postgres.
 */

const db = require('../db/models');

const {
    progressStatuses,
    resourceProviders,
} = require('../common/constants');

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
        where.certificationId = query.certificationId
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

    let updatedProgress = await helper.update(progress, acceptanceData)
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
 * Delete FccCertificationProgress by ID
 * 
 * @param {String} currentUser the user making the request
 * @param {String} progressId the ID of the CertificationProgress 
 * @returns {Object} the deleted CertificationProgress
 */
async function deleteCertificationProgress(currentUser, progressId) {
    // let progress = await helper.getByIdAndUser('CertificationProgress', progressId, currentUser.userId)

    let progress = await getCertificationProgress(currentUser.userId, progressId);
    if (progress) {
        await progress.destroy()
    }
    return progress
}

module.exports = {
    acceptAcademicHonestyPolicy,
    deleteCertificationProgress,
    getCertificationProgress,
    searchCertificationProgresses,
}
