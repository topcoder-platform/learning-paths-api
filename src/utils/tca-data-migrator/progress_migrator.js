'use strict';

const db = require('../../db/models');
const dbHelper = require('../../common/dbHelper');
const helper = require('../../common/helper');
const { tcaDatastoreIsPostgres } = require('./migration_utilities');

const FCC_PROVIDER_NAME = 'freeCodeCamp';
let fccLessonMap = {};

async function migrateProgresses() {
    await verifyCanMigrateData();

    let newProgresses;
    let progresses = [];
    try {
        // TODO: confirm we don't need this ID to create data
        // const fccProviderId = await getFccProviderId();
        const fccCertifications = await getFccCertifications();
        const fccCourses = await getFccCourses();
        const certProgresses = await getTcaDynamoCertProgresses();

        if (certProgresses && certProgresses.length > 0) {
            console.log(`** Got ${certProgresses.length} DynamoDB CertificationProgress documents`);
            for (let tcaProgress of certProgresses) {
                const progress = await buildCertificationProgressAttrs(tcaProgress, fccCertifications, fccCourses);

                if (progress) {
                    progresses.push(progress);
                }
            }
            console.log(`** Bulk inserting ${progresses.length} Postgres FccCertificationProgress records`)
            newProgresses = await createCertificationProgresses(progresses);
        }
    } catch (error) {
        console.error(error);
    }
}

/**
 * Checks various preconditions to successfully executing the TCA 
 * data migration.
 */
async function verifyCanMigrateData() {
    if (tcaDatastoreIsPostgres()) {
        throw "** TCA_DATASTORE env var is set to 'postgres' -- change this to 'dynamodb' to migrate TCA data -- exiting"
    }

    if (await fccCertProgressDataExists()) {
        throw "** The Postgres DB already contains freeCodeCamp certification progress data -- exiting"
    }
}

/**
 * Checks the TCA Postgres database to see if any FCC certification 
 * progress data already exists. 
 * 
 * @returns boolean true if FCC data exists, false otherwise
 */
async function fccCertProgressDataExists() {
    let dataExists = false;
    try {
        const certCount = await db.FccCertificationProgress.count();

        dataExists = (certCount > 0);
    } catch (error) {
        console.error(error);
    } finally {
        return dataExists;
    }
}

async function getFccProviderId() {
    const where = { name: FCC_PROVIDER_NAME }
    const fccProvider = await dbHelper.findOne('ResourceProvider', where);

    if (!fccProvider) {
        throw "** Could not get FreeCodeCamp resource provider -- exiting"
    }

    return fccProvider.id;
}

async function getFccCertifications() {
    const fccCerts = await db.FreeCodeCampCertification.findAll();
    if (!fccCerts || fccCerts.length == 0) {
        throw "** Could not retrieve FreeCodeCampCertifications -- exiting"
    }

    return fccCerts;
}

async function getFccCourses() {
    const fccCourses = await db.FccCourse.findAll();
    if (!fccCourses || fccCourses.length == 0) {
        throw "** Could not retrieve FccCourses -- exiting"
    }

    return fccCourses;
}

async function createCertificationProgresses(progresses) {
    const newProgresses = await db.FccCertificationProgress.bulkCreate(progresses, {
        include: [{
            model: db.FccModuleProgress,
            as: 'moduleProgresses',
            include: [{
                model: db.FccCompletedLesson,
                as: 'completedLessons'
            }]
        }]
    });

    return newProgresses;
}

async function buildCertificationProgressAttrs(tcaProgress, fccCertifications, fccCourses) {
    const progressCertId = tcaProgress.certificationId;
    const progressCertification = tcaProgress.certification;
    const progressCourseId = tcaProgress.courseId;
    const progressCourseKey = tcaProgress.courseKey;

    const fccCert = fccCertifications.find(cert => cert.fccId == progressCertId)
    const fccCourse = fccCourses.find(course => course.fccCourseUuid == progressCourseId)

    // check that we have a matching FCC certification and course in the database,
    // bailout if not.
    if (!fccCert) {
        console.error(`-- Could not find FreeCodeCampCertification ${progressCertification}, ID ${progressCertId} for user ${tcaProgress.userId}`);
        return undefined;
    } else {
        console.log(`** Processing certification ${progressCertification} for user ${tcaProgress.userId}`)
    }

    if (!fccCourse) {
        console.error(`-- Could not find FccCourse ${progressCourseKey}, ID ${progressCourseId} for user ${tcaProgress.userId}`);
        return undefined;
    }

    const certProgressAttrs = {
        fccCertificationId: fccCert.id,
        certProgressDynamoUuid: tcaProgress.id,
        fccCourseId: fccCourse.id,
        userId: tcaProgress.userId,
        certification: tcaProgress.certification,
        certificationId: tcaProgress.certificationId,
        certificationTitle: tcaProgress.certificationTitle,
        certificationTrackType: tcaProgress.certificationTrackType,
        certType: tcaProgress.certType,
        courseKey: tcaProgress.courseKey,
        status: tcaProgress.status,
        startDate: tcaProgress.startDate,
        completedDate: tcaProgress.completedDate,
        academicHonestyPolicyAcceptedAt: tcaProgress.academicHonestyPolicyAcceptedAt,
        currentLesson: tcaProgress.currentLesson,
        certificationImageUrl: tcaProgress.certificationImageUrl,
        moduleProgresses: await buildModuleProgressAttrs(tcaProgress.modules),
        createdAt: tcaProgress.createdAt,
        updatedAt: tcaProgress.updatedAt
    }

    return certProgressAttrs;
}

async function buildModuleProgressAttrs(tcaModuleProgresses) {
    let moduleProgressAttrs = [];

    for (const moduleProgress of tcaModuleProgresses) {
        const module = {
            module: moduleProgress.module,
            moduleStatus: moduleProgress.moduleStatus,
            lessonCount: moduleProgress.lessonCount,
            isAssessment: moduleProgress.isAssessment,
            startDate: moduleProgress.startDate,
            completedDate: moduleProgress.completedDate,
            completedLessons: await buildCompletedLessonsAttrs(moduleProgress.completedLessons)
        }
        moduleProgressAttrs.push(module);
    }

    return moduleProgressAttrs;
}

async function buildCompletedLessonsAttrs(tcaCompletedLessons) {
    let completedLessonAttrs = [];
    let lessonSet = new Set();

    for (const tcaLesson of tcaCompletedLessons) {
        // Some older completed lesson records may lack the 
        // original FCC lesson ID -- try to fill it in
        let tcaLessonId = tcaLesson.id || fccLessonMap[tcaLesson.dashedName];
        if (tcaLessonId == null) {
            const lesson = await db.FccLesson.findOne({ where: { dashedName: tcaLesson.dashedName } })
            if (lesson) {
                fccLessonMap[lesson.dashedName] = lesson.id;
                tcaLessonId = lesson.id;
                // console.log("** found lesson", lesson.dashedName, "id", lesson.id)
            } else {
                console.error('** could not find FCC lesson', tcaLesson.dashedName)
            }
        }

        // Handle the case where the original DynamoDB data can contain 
        // duplicate entries for the same completed lesson. Keep track of 
        // the lesson IDs that have already been added and skip any duplicates.
        if (!lessonSet.has(tcaLessonId)) {
            lessonSet.add(tcaLessonId)
            const completedLesson = {
                id: tcaLessonId,
                dashedName: tcaLesson.dashedName,
                completedDate: tcaLesson.completedDate,
            };
            completedLessonAttrs.push(completedLesson);
        }
    }

    return completedLessonAttrs;
}

async function getTcaDynamoCertProgresses() {
    const progresses = await helper.scanAll('CertificationProgress');

    return progresses;
}

module.exports = {
    migrateProgresses
}