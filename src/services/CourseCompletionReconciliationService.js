'use strict';

const _ = require('lodash');

const dbHelper = require('../common/helper')
const { getCompletedChallengesForAllUsers } = require('./FreeCodeCampDataService');
const { getCourseLessonMap } = require('./CourseService');

let courseLessonMap;
let inProgressCerts;
let completedFccChallengeMap;
let reconciliationLog;

async function reconcileCourseCompletion() {
    console.log("Starting lesson completion reconciliation...");

    await generateReconciliationLog()
}

async function generateReconciliationLog() {
    courseLessonMap = await getCourseLessonMap('freeCodeCamp');
    inProgressCerts = await getInProgressCerts();
    completedFccChallengeMap = await getCompletedFccChallengesMap();

    reconciliationLog = reconcileCertifications(inProgressCerts, completedFccChallengeMap);
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

    let reconciliationLog = {};

    for (let cert of inProgressCerts) {
        const { userId, certification, modules } = cert;

        for (let module of modules) {
            const moduleKey = module.module;

            if (module.moduleStatus != 'in-progress') continue;

            const diff = diffModuleCompletion(userId, certification, module, fccChallengeMap);

            // Record any diffs in the reconciliation log
            // The check for diff.lessons > 0 will exclude any case where 
            // the TCA DB shows more lessons being completed than FCC. This 
            // can happen due to using the test script to advance through a 
            // course automatically, which does not update FCC.
            if (!_.isEmpty(diff) && diff.lessons > 0) {
                if (reconciliationLog[userId]) {
                    if (reconciliationLog[userId][certification]) {
                        reconciliationLog[userId][certification][moduleKey] = diff
                    } else {
                        reconciliationLog[userId][certification] = {
                            [moduleKey]: diff
                        }
                    }
                } else {
                    reconciliationLog[userId] = {
                        [certification]: {
                            [moduleKey]: diff
                        }
                    }
                }
            }
        }
    }

    console.log("reconciliation log entries:", Object.keys(reconciliationLog).length);
    console.log(JSON.stringify(reconciliationLog, null, 2));

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
    const moduleKey = module.module;
    let diff = {};

    try {
        // get the IDs of lessons for this cert/module that FCC shows the user completing
        const fccLessonsCompleted = fccChallengeMap?.[userId]?.[certification]?.[moduleKey];

        // if they've completed any, compare these to the lessons completed for the
        // same module in Topcoder Academy
        if (fccLessonsCompleted) {
            const fccLessonSet = new Set(fccLessonsCompleted);

            let tcaLessonsCompleted = module.completedLessons.map(lesson => lesson.id);
            tcaLessonsCompleted = tcaLessonsCompleted.filter(lesson => lesson != null);

            const tcaLessonSet = new Set(tcaLessonsCompleted);

            // Find the difference between the set of lessons completed in FCC and TCA
            const missingFccLessons = Array.from(difference(fccLessonSet, tcaLessonSet));

            const lessonDiff = missingFccLessons.length;

            if (lessonDiff > 0) {
                // resolve the lesson IDs to the named lesson, so we can more 
                // easily do manual QA against the TCA database
                const lessonIdNameMap = resolveLessonNames(missingFccLessons);

                diff = {
                    lessons: lessonDiff,
                    lessonIds: missingFccLessons,
                    lessonNames: lessonIdNameMap,
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
 * Resolves lesson IDs to their dashed name
 * 
 * @param {Array} fccLessonIds array of lesson IDs
 * @returns map of lesson Ids to their dashed name
 */
function resolveLessonNames(fccLessonIds) {
    let lessonIdNameMap = {}
    for (let id of fccLessonIds) {
        const lesson = courseLessonMap[id]
        if (lesson) {
            lessonIdNameMap[id] = lesson.dashedName
        }
    }

    return lessonIdNameMap;
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