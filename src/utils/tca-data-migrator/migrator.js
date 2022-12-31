'use strict';

const certificationService = require('../../services/CertificationService');
const courseService = require('../../services/CourseService');
const db = require('../../db/models');

const FCC_PROVIDER = 'freeCodeCamp';

let certCategories;
let fccCerts;

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

        console.log('newCerts', newCerts);
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
    fccCerts = await db.FreeCodeCampCertification.findAll();

    let newCourses;
    let courses = [];
    try {
        const tcaCourses = await getTcaDynamoCourses();

        if (tcaCourses && tcaCourses.length > 0) {
            for (let tcaCourse of tcaCourses) {
                const course = buildCourseAttrs(tcaCourse);
                if (course) {
                    courses.push(course);
                }
            }
            console.log(`Bulk inserting ${courses.length} courses`)
            console.dir(courses[0], { depth: null });
            // newCourses = await createCourses(courses);
        }

        console.log('newCourses', newCourses);
    } catch (error) {
        console.error(error);
    }

}

async function createCourses(courses) {
    const newCourses = await db.FccCourse.bulkCreate(courses, {
        include: [
            // {
            // association: db.FccModule,
            // as: 'modules',
            // include: [{
            //     association: db.FccLesson,
            //     as: 'lessons'
            // }]
            // }
            {
                association: db.FccModule,
                as: 'modules'
            }
        ]
    });

    return newCourses;
}

function buildCourseAttrs(tcaCourse) {
    const cert = fccCerts.find(fccCert => fccCert.fccId == tcaCourse.certificationId)
    if (!cert) {
        console.error(`Could not find certification with fccId ${tcaCourse.certificationId} for course ${tcaCourse.title}`)
        return undefined
    }

    const courseAttrs = {
        id: tcaCourse.id,
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
    const query = { providerName: FCC_PROVIDER };
    const certifications = await certificationService.searchCertifications(query);
    // console.log(certifications.result);

    return certifications.result
}

async function getTcaDynamoCourses() {
    const query = { provider: FCC_PROVIDER }
    const courses = await courseService.searchCourses(query);
    // console.dir(courses, { depth: null });

    return courses;
}

module.exports = {
    migrateCertifications,
    migrateCourses
}