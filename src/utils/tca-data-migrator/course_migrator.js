'use strict';

const certificationService = require('../../services/CertificationService');
const courseService = require('../../services/CourseService');
const db = require('../../db/models');
const fccCourseSkills = require('../../db/models/fcc_course_skills.json')

let fccResourceProvider;
const FCC_PROVIDER_NAME = 'freeCodeCamp';

let certCategories;
let fccCerts;

/**
 * This function loads all of the freeCodeCamp certifications, courses,
 * modules, and lessons from DynamoDB into Postgres. It assumes the database
 * is empty when it runs and does not check for existing data.
 */
async function migrate() {
    let certs = await migrateCertifications();
    let courses = await migrateCourses();
}

async function migrateCertifications() {
    certCategories = await getCertCategories();

    let newCerts;
    const certifications = [];

    try {
        const tcaCertifications = await getTcaDynamoCertifications();

        if (tcaCertifications && tcaCertifications.length > 0) {
            for (let tcaCert of tcaCertifications) {
                certifications.push(buildCertificationAttrs(tcaCert))
            }
            console.log(`Bulk inserting ${certifications.length} certifications`)
            newCerts = await db.FreeCodeCampCertification.bulkCreate(certifications);
        }
    } catch (error) {
        console.error(error);
    }

    return newCerts;
}

function buildCertificationAttrs(tcaCert) {
    const certCategory = certCategories.find(certCat => certCat.category == tcaCert.category)
    if (!certCategory) {
        throw `Could not find certification category ${tcaCert.category}`
    }

    const certAttrs = {
        fccId: tcaCert.id,
        key: tcaCert.key,
        providerCertificationId: tcaCert.providerCertificationId,
        title: tcaCert.title,
        certification: tcaCert.certification,
        completionHours: tcaCert.completionHours,
        state: tcaCert.state,
        certificationCategoryId: certCategory.id,
        certType: tcaCert.certType,
        publishedAt: tcaCert.publishedAt,
        createdAt: tcaCert.createdAt,
        updatedAt: tcaCert.updatedAt
    }

    return certAttrs;
}

async function migrateCourses() {
    fccResourceProvider = await db.ResourceProvider.findOne({ where: { name: FCC_PROVIDER_NAME } })
    if (!fccResourceProvider) {
        throw "Could not find FCC ResourceProvider"
    }

    fccCerts = await db.FreeCodeCampCertification.findAll();
    if (!fccCerts || fccCerts.length == 0) {
        throw "No FCC Certifications found -- cannot load course data"
    } else {
        console.log(`** Migrating FCC courses for ${fccCerts.length} certifications`)
    }

    let newCourses;
    let courses = [];
    try {
        const tcaCourses = await getTcaDynamoCourses();

        if (tcaCourses && tcaCourses.length > 0) {
            for (let tcaCourse of tcaCourses) {
                console.log('** migrating course', tcaCourse.key)
                const course = buildCourseAttrs(tcaCourse);
                if (course) {
                    courses.push(course);
                }
            }
            console.log(`** Bulk inserting ${courses.length} courses`)
            newCourses = await createCourses(courses);
        }
    } catch (error) {
        console.error(error);
    }

    return newCourses;
}

async function createCourses(courses) {
    const newCourses = await db.FccCourse.bulkCreate(courses, {
        include: [{
            model: db.FccModule,
            as: 'modules',
            include: [{
                model: db.FccLesson,
                as: 'lessons'
            }]
        }]
    });

    return newCourses;
}

function buildCourseAttrs(tcaCourse) {
    const cert = fccCerts.find(fccCert => fccCert.fccId == tcaCourse.certificationId)
    if (!cert) {
        console.error(`Could not find certification with fccId ${tcaCourse.certificationId} for course ${tcaCourse.title}`)
        return undefined
    }

    const courseSkills = fccCourseSkills[tcaCourse.key]
    if (!courseSkills) {
        console.error(`Could not find skills for course ${tcaCourse.key}`)
    }

    const courseAttrs = {
        fccCourseUuid: tcaCourse.id,
        providerId: fccResourceProvider.id,
        key: tcaCourse.key,
        title: tcaCourse.title,
        certificationId: cert.id,
        modules: buildModulesAttrs(tcaCourse.modules),
        estimatedCompletionTimeValue: tcaCourse.estimatedCompletionTime.value,
        estimatedCompletionTimeUnits: tcaCourse.estimatedCompletionTime.units,
        introCopy: tcaCourse.introCopy,
        keyPoints: tcaCourse.keyPoints,
        completionSuggestions: tcaCourse.completionSuggestions,
        note: tcaCourse.note,
        learnerLevel: 'Beginner',
        skills: courseSkills,
        createdAt: tcaCourse.createdAt,
        updatedAt: tcaCourse.updatedAt
    }

    return courseAttrs;
}

function buildModulesAttrs(tcaModules) {
    let module;
    let modules = [];

    for (const tcaModule of tcaModules) {
        const meta = tcaModule.meta;

        module = {
            key: tcaModule.key,
            name: meta.name,
            dashedName: meta.dashedName,
            estimatedCompletionTimeValue: meta.estimatedCompletionTime.value,
            estimatedCompletionTimeUnits: meta.estimatedCompletionTime.units,
            introCopy: meta.introCopy,
            isAssessment: meta.isAssessment,
            lessons: buildLessonsAttrs(tcaModule.lessons)
        }
        modules.push(module);
    }

    return modules;
}

function buildLessonsAttrs(tcaLessons) {
    let lesson;
    let lessons = [];
    let order = 0;

    for (const tcaLesson of tcaLessons) {
        lesson = {
            id: tcaLesson.id,
            title: tcaLesson.title,
            dashedName: tcaLesson.dashedName,
            isAssessment: tcaLesson.isAssessment,
            order: order++
        };
        lessons.push(lesson);
    }

    return lessons;
}

async function getCertCategories() {
    const certificationCategories = await db.CertificationCategory.findAll();

    return certificationCategories;
}

async function getTcaDynamoCertifications() {
    const query = { providerName: FCC_PROVIDER_NAME };
    const certifications = await certificationService.searchCertifications(query);
    // console.log(certifications.result);

    return certifications.result
}

async function getTcaDynamoCourses() {
    const query = { provider: FCC_PROVIDER_NAME }
    const { result: courses } = await courseService.scanAllCourses(query);
    // console.dir(courses, { depth: null });

    return courses;
}

module.exports = {
    migrate,
    migrateCertifications,
    migrateCourses
}