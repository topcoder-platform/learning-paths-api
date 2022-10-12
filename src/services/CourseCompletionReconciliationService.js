'use strict';

const dbHelper = require('../common/helper')

const { getCompletedChallengesForAllUsers } = require('./FreeCodeCampDataService');
const { getCourseLessonMap } = require('./CourseService');

async function reconcileCourseCompletion() {
    const inProgressCerts = await getInProgressCerts();
    const completedFccChallengeMap = await getCompletedFccChallengesMap();
    reconcileCertifications(inProgressCerts, completedFccChallengeMap);
}

async function getInProgressCerts() {
    const certificationProgresses = await dbHelper.scanAll('CertificationProgress')
    console.log(`** cert progress records: ${certificationProgresses.length}`)

    const inProgressCerts = certificationProgresses
        .filter(certProgress => certProgress.status === 'in-progress')
    console.log(`** in-progress records:  ${inProgressCerts.length}`)

    return inProgressCerts
}

/**
 * Creates a map of each user's completed FCC lesson IDs for each  
 * certification and module so we can easily lookup data. The map
 * is structured as follows:
 * 
 * {
    <userId>: {
        <certificationKey>: {
            <moduleKey>: [
                <lessonId>,
                <lessonId>,
                ...
            ]
        }, 
        ...
    }, 
    ...
 */
async function getCompletedFccChallengesMap() {
    const courseLessonMap = await getCourseLessonMap('freeCodeCamp');
    const completedFccChallengesByUser = await getCompletedChallengesForAllUsers();

    let fccChallengeMap = {};
    for (let user of completedFccChallengesByUser) {
        if (user.completedChallenges.length == 0) continue;

        // TODO: just using one user for testing -- remove next line
        if (user.userId != '88778750') continue;

        let certificationMap = {};
        for (let challenge of user.completedChallenges) {
            const lessonId = challenge.id;
            const lesson = courseLessonMap[lessonId];

            const module = lesson.moduleKey;
            const certification = lesson.certification;

            if (certificationMap[certification]) {
                if (certificationMap[certification][module]) {
                    certificationMap[certification][module].push(lessonId)
                } else {
                    certificationMap[certification][module] = [lessonId]
                }
            } else {
                certificationMap[certification] = {}
            }
        }
        fccChallengeMap[user.userId] = certificationMap;
    }

    return fccChallengeMap;
}

/**
 * Reconciles the difference between the completed lesson information in 
 * FCC and the Topcoder Academy database. Records discrepancies.
 * 
 * @param {Array} inProgressCerts an array of certification progress records
 * @param {Object} fccChallengeMap a map of user FCC cert/module/lessons
 */
function reconcileCertifications(inProgressCerts, fccChallengeMap) {

    for (let cert of inProgressCerts) {
        const { userId, certification, modules } = cert;
        // TODO - for testing only
        if (userId != '88778750') continue;

        for (let module of modules) {
            if (module.moduleStatus != 'in-progress') continue;
            // TODO - for testing
            if (module.module != 'learn-css-colors-by-building-a-set-of-colored-markers') continue;

            const diff = diffModuleCompletion(userId, certification, module, fccChallengeMap);
            console.log(diff);
        }
    }
}

/**
 * Performs a comparison of the completed lessons between TCA and FCC
 * for a particular certification and module
 * 
 * @param {String} userId user ID
 * @param {String} certification certification name
 * @param {Object} module CertificationProgress module
 * @param {Object} fccChallengeMap map of FCC user completed cert/module/lessons
 */
function diffModuleCompletion(userId, certification, module, fccChallengeMap) {
    const moduleKey = module.module;

    const fccLessonsCompleted = fccChallengeMap[userId][certification][moduleKey];
    const fccLessonSet = new Set(fccLessonsCompleted);

    const moduleLessonsCompleted = module.completedLessons.map(lesson => lesson.id);
    const moduleLessonSet = new Set(moduleLessonsCompleted);

    const extraFccLessons = Array.from(difference(fccLessonSet, moduleLessonSet));
    const extraModuleLessons = Array.from(difference(moduleLessonSet, fccLessonSet));

    const lessonDiff = fccLessonsCompleted.length - moduleLessonsCompleted.length;

    let diff = {};
    if (lessonDiff != 0) {
        diff = {
            lessons: lessonDiff,
            fcc: extraFccLessons,
            tca: extraModuleLessons
        }
        console.log("** Discrepancy in", moduleKey, diff);

    }
    return diff;
}

function difference(setA, setB) {
    const _difference = new Set(setA);
    for (const elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
}

module.exports = {
    reconcileCourseCompletion
}