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
        const fccCourses = await getFccCourses();
        const certProgresses = await getTcaDynamoCertProgresses();

        if (certProgresses && certProgresses.length > 0) {
            console.log(`** Got ${certProgresses.length} DynamoDB CertificationProgress documents`);
            for (let tcaProgress of certProgresses) {
                const progress = buildCourseProgressAttrs(tcaProgress, fccProviderId, fccCourses);

                if (progress) {
                    progresses.push(progress);
                }
            }
            console.log(`** Bulk inserting ${progresses.length} Postgres FccCourseProgress records`)
            newProgresses = await createCourseProgresses(progresses);
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

async function getFccCourses() {
    const fccCourses = await db.FccCourse.findAll();
    if (!fccCourses || fccCourses.length == 0) {
        throw "Could not retrieve FccCourses"
    }

    return fccCourses;
}

async function createCourseProgresses(progresses) {
    const newProgresses = await db.FccCourseProgress.bulkCreate(progresses, {
        include: [{
            model: db.FccModuleProgress,
            as: 'modules',
            include: [{
                model: db.FccCompletedLesson,
                as: 'completedLessons'
            }]
        }]
    });

    return newProgresses;
}

function buildCourseProgressAttrs(tcaProgress, fccProviderId, fccCourses) {
    const progressCourseId = tcaProgress.courseId;
    const progressCourseKey = tcaProgress.courseKey;

    const fccCourse = fccCourses.find(course => course.id == progressCourseId)

    if (!fccCourse) {
        console.error(`-- Could not find FccCourse ${progressCourseKey}, ID ${progressCourseId} for user ${tcaProgress.userId}`);
        return undefined;
    } else {
        console.log(`** Processing course ${progressCourseKey} for user ${tcaProgress.userId}`)
    }

    const courseProgressAttrs = {
        fccProgressId: tcaProgress.id,
        userId: tcaProgress.userId,
        fccCourseId: fccCourse.id,
        certification: tcaProgress.certification,
        certificationId: tcaProgress.certificationId,
        certificationTitle: tcaProgress.certificationTitle,
        certificationTrackType: tcaProgress.certificationTrackType,
        certType: tcaProgress.certType,
        courseKey: tcaProgress.courseKey,
        fccCourseId: tcaProgress.courseId,
        providerId: fccProviderId,
        status: tcaProgress.status,
        startDate: tcaProgress.startDate,
        completedDate: tcaProgress.completedDate,
        academicHonestyPolicyAcceptedAt: tcaProgress.academicHonestyPolicyAcceptedAt,
        currentLesson: tcaProgress.currentLesson,
        certificationImageUrl: tcaProgress.certificationImageUrl,
        modules: buildModuleProgressAttrs(tcaProgress.modules),
        createdAt: tcaProgress.createdAt,
        updatedAt: tcaProgress.updatedAt
    }

    return courseProgressAttrs;
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