'use strict';

const db = require('../../db/models');
const dbHelper = require('../../common/dbHelper');
const helper = require('../../common/helper');

const FCC_PROVIDER_NAME = 'freeCodeCamp';

async function migrateProgresses() {
    let newProgresses;
    let progresses = [];
    try {
        const fccProviderId = await getFccProviderId();
        const fccCertifications = await getFccCertifications();
        const fccCourses = await getFccCourses();
        const certProgresses = await getTcaDynamoCertProgresses();

        if (certProgresses && certProgresses.length > 0) {
            console.log(`** Got ${certProgresses.length} DynamoDB CertificationProgress documents`);
            for (let tcaProgress of certProgresses) {
                const progress = buildCertificationProgressAttrs(tcaProgress, fccCertifications, fccCourses);

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

async function getFccProviderId() {
    const where = { name: FCC_PROVIDER_NAME }
    const fccProvider = await dbHelper.findOne('ResourceProvider', where);

    if (!fccProvider) {
        throw "Could not get FreeCodeCamp resource provider"
    }

    return fccProvider.id;
}

async function getFccCertifications() {
    const fccCerts = await db.FreeCodeCampCertification.findAll();
    if (!fccCerts || fccCerts.length == 0) {
        throw "Could not retrieve FreeCodeCampCertifications"
    }

    return fccCerts;
}

async function getFccCourses() {
    const fccCourses = await db.FccCourse.findAll();
    if (!fccCourses || fccCourses.length == 0) {
        throw "Could not retrieve FccCourses"
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

function buildCertificationProgressAttrs(tcaProgress, fccCertifications, fccCourses) {
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
        moduleProgresses: buildModuleProgressAttrs(tcaProgress.modules),
        createdAt: tcaProgress.createdAt,
        updatedAt: tcaProgress.updatedAt
    }

    return certProgressAttrs;
}

function buildModuleProgressAttrs(tcaModuleProgresses) {
    let moduleProgressAttrs = [];

    for (const moduleProgress of tcaModuleProgresses) {
        const module = {
            module: moduleProgress.module,
            moduleStatus: moduleProgress.moduleStatus,
            lessonCount: moduleProgress.lessonCount,
            isAssessment: moduleProgress.isAssessment,
            startDate: moduleProgress.startDate,
            completedDate: moduleProgress.completedDate,
            completedLessons: buildCompletedLessonsAttrs(moduleProgress.completedLessons)
        }
        moduleProgressAttrs.push(module);
    }

    return moduleProgressAttrs;
}

function buildCompletedLessonsAttrs(tcaCompletedLessons) {
    let completedLessonAttrs = [];

    for (const tcaLesson of tcaCompletedLessons) {
        const lesson = {
            id: tcaLesson.id,
            dashedName: tcaLesson.dashedName,
            completedDate: tcaLesson.completedDate,
        };
        completedLessonAttrs.push(lesson);
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