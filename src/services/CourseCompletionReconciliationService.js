'use strict';

const _ = require('lodash');
const { checkAndSetModuleStatus } = require('./CertificationProgressService');

const dbHelper = require('../common/helper')
const { getCompletedChallengesForAllUsers } = require('./FreeCodeCampDataService');
const { getCourseLessonMap } = require('./CourseService');

let courseLessonMap;
let inProgressCerts;
let completedFccChallengeMap;
let reconciliationLog;

async function reconcileCourseCompletion() {
    console.log("Starting lesson completion reconciliation...");

    await generateReconciliationLog();
    await reconcileCertificationProgress();
}

async function generateReconciliationLog() {
    courseLessonMap = await getCourseLessonMap('freeCodeCamp');
    inProgressCerts = await getInProgressCerts();
    completedFccChallengeMap = await getCompletedFccChallengesMap();

    reconciliationLog = reconcileCertifications(inProgressCerts, completedFccChallengeMap);
}

/**
 * Updates user CertificationProgress records based on data in the 
 * reconciliation log. Adds missing lessons and updates module and 
 * course completion statuses, returning a log of what was done.
 */
async function reconcileCertificationProgress() {
    console.log("\nUpdating certification progress data...");

    if (_.isEmpty(reconciliationLog)) {
        console.log("...reconciliation log is empty -- nothing to do")
        return
    }

    const userCount = Object.keys(reconciliationLog).length;
    console.log(`...updating records for ${userCount} users`)

    for (const [userId, certifications] of Object.entries(reconciliationLog)) {
        for (const [certificationKey, reconciliationDetails] of Object.entries(certifications)) {
            await updateCertificationProgress(userId, certificationKey, reconciliationDetails)
        }
    }
}

async function updateCertificationProgress(userId, certificationKey, reconciliationDetails) {
    console.log(`\nupdating user ${userId} certification '${certificationKey}'`)

    const certProgressId = reconciliationDetails.id;
    let progress = await dbHelper.getById('CertificationProgress', certProgressId)

    for (const [moduleKey, moduleDetails] of Object.entries(reconciliationDetails.modules)) {
        const moduleIndex = progress.modules.findIndex(mod => mod.module == moduleKey)
        if (moduleIndex == -1) {
            throw `Error: could not find module ${moduleKey} in cert progress ${certificationKey} (${certProgressId})`
        }

        let reconciledLessons = [];
        for (const [lessonId, lessonDetails] of Object.entries(moduleDetails.lessons)) {
            const completedLesson = {
                dashedName: lessonDetails.name,
                completedDate: new Date(lessonDetails.completedDate),
                id: lessonId
            }
            reconciledLessons.push(completedLesson);
        }
        const addedLessonCount = reconciledLessons.length;
        const plural = addedLessonCount == 1 ? '' : 's';
        console.log(`...adding ${addedLessonCount} completed lesson${plural} to '${moduleKey}'`)

        // check for duplicates of lessons that were completed but didn't have an
        // +id+ attribute
        const completedLessonNames = progress.modules[moduleIndex].completedLessons.map(lesson => lesson.dashedName);
        for (const reconciledLesson of reconciledLessons) {
            const completedLessonIndex = _.indexOf(completedLessonNames, reconciledLesson.dashedName)

            // if the reconciled lesson is already in the completed lessons list, replace
            // the completed lesson with the reconciled one (which will include the ID)
            if (completedLessonIndex != -1) {
                progress.modules[moduleIndex].completedLessons[completedLessonIndex] = reconciledLesson;
            } else {
                progress.modules[moduleIndex].completedLessons.push(reconciledLesson)
            }
        }

        checkAndSetModuleStatus(userId, progress.modules[moduleIndex])
    }

    // update the certitication progress record with the reconciled 
    // module lesson completion
    const idObj = {
        id: certProgressId,
        certification: progress.certification
    }

    const updatedModules = {
        modules: progress.modules
    }

    await dbHelper.updateAtomic("CertificationProgress", idObj, updatedModules);
}

async function getInProgressCerts() {
    console.log("\nGetting in-progress certifications...");

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
    console.log("\nGetting FCC completed challenges...");

    const completedFccChallengesByUser = await getCompletedChallengesForAllUsers();

    let fccChallengeMap = {};
    for (let user of completedFccChallengesByUser) {
        if (user.completedChallenges.length == 0) continue;

        let certificationMap = {};
        for (let challenge of user.completedChallenges) {
            const lessonId = challenge.id;
            const completedDate = challenge.completedDate;

            const lesson = courseLessonMap[lessonId];

            if (!lesson) {
                console.error(`** user ${user.userId} lesson ${lessonId} not found in courseLessonMap`);
                continue;
            }

            const module = lesson.moduleKey;
            const certification = lesson.certification;

            const completedChallenge = {
                lessonId: lessonId,
                completedDate: completedDate
            }

            if (certificationMap[certification]) {
                if (certificationMap[certification][module]) {
                    certificationMap[certification][module].push(completedChallenge)
                } else {
                    certificationMap[certification][module] = [completedChallenge]
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
    let reconciliationLog = {};

    for (let certificationProgress of inProgressCerts) {
        const { id, userId, certification, modules } = certificationProgress;

        for (let module of modules) {
            const moduleKey = module.module;

            if (module.moduleStatus != 'in-progress') continue;

            const diff = diffModuleCompletion(userId, certification, module, fccChallengeMap);

            // Record any diffs in the reconciliation log
            // The check for diff.lessonDiff > 0 will exclude any case where 
            // the TCA DB shows more lessons being completed than FCC. This 
            // can happen due to using the test script to advance through a 
            // course automatically, which does not update FCC.
            if (!_.isEmpty(diff) && diff.lessonDiff > 0) {
                if (reconciliationLog[userId]) {
                    if (reconciliationLog[userId][certification]) {
                        reconciliationLog[userId][certification].modules[moduleKey] = diff
                    } else {
                        reconciliationLog[userId][certification] = {
                            id: id,
                            modules: {
                                [moduleKey]: diff
                            }
                        }
                    }
                } else {
                    reconciliationLog[userId] = {
                        [certification]: {
                            id: id,
                            modules: {
                                [moduleKey]: diff
                            }
                        }
                    }
                }
            }
        }
    }

    return reconciliationLog;
}

/**
 * Performs a comparison of the completed lessons between Topcoder Academy
 * and freeCodeCamp databases for a particular certification and module
 * 
 * @param {String} userId user ID
 * @param {String} certification certification name
 * @param {Object} module CertificationProgress module
 * @param {Object} fccChallengeMap map of FCC user completed cert/module/lessons
 */
function diffModuleCompletion(userId, certification, module, fccChallengeMap) {
    let diff = {};
    const moduleKey = module.module;

    try {
        // get the IDs of lessons for this cert/module that FCC shows the user completing
        const fccLessonsCompleted = fccChallengeMap?.[userId]?.[certification]?.[moduleKey];

        // if they've completed any, compare these to the lessons completed for the
        // same module in Topcoder Academy. 
        if (fccLessonsCompleted) {
            // Create a map of id : completedDate
            let fccLessonMap = {};
            for (let lesson of fccLessonsCompleted) {
                fccLessonMap[lesson.lessonId] = lesson.completedDate
            }

            // Extract just the lesson IDs from the objects { id: completedDate, ... } 
            const fccLessonIds = Object.keys(fccLessonMap);
            const fccLessonSet = new Set(fccLessonIds);

            let tcaLessonsCompleted = module.completedLessons.map(lesson => lesson.id);
            tcaLessonsCompleted = tcaLessonsCompleted.filter(lesson => lesson != null);

            const tcaLessonSet = new Set(tcaLessonsCompleted);

            // Find the difference between the set of lessons completed in FCC and TCA
            const missingFccLessons = Array.from(difference(fccLessonSet, tcaLessonSet));

            const lessonDiff = missingFccLessons.length;

            if (lessonDiff > 0) {
                // resolve the lesson IDs to the named lesson, so we can more 
                // easily do manual QA against the TCA database
                const lessonDetails = buildLessonDetails(missingFccLessons, fccLessonMap);

                diff = {
                    lessonDiff: lessonDiff,
                    lessons: lessonDetails,
                }
            }
        }

    } catch (error) {
        console.log(`\nError processing ${userId} certification '${certification}' module '${moduleKey}'\n`)
        console.log(`FCC challenges`, fccChallengeMap[userId]);
        console.error(error);
    }

    return diff;
}

/**
 * Builds a map of lesson details keyed by id, as in:
 * 
 * {
 *   <lesson id>: {
 *      name: <lesson name>,
 *      completedDate: <lesson completed date>
 *   }, ...
 * }
 * 
 * @param {Array} fccLessonIds array of lesson IDs
 * @returns map of lesson Ids to their dashed name
 */
function buildLessonDetails(fccLessonIds, fccLessonMap) {
    let lessonDetails = {}
    for (let id of fccLessonIds) {
        const lesson = courseLessonMap[id]
        if (lesson) {
            lessonDetails[id] = {
                name: lesson.dashedName,
                completedDate: fccLessonMap[id]
            }
        }
    }
    return lessonDetails;
}

/**
 * Computes the difference between two sets 
 * 
 * @param {Set} setA a set
 * @param {Set} setB another set
 * @returns Set with the elements in setA that are not in setB
 */
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