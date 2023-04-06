#!/usr/bin/env node

'use strict';

// TODO: this tool is currently deprecated as we are not updating 
// the FreeCodeCamp course content currently.
console.error("** This tool is deprecated pending the next FreeCodeCamp curriculum update **");
return;

/**
 * freeCodeCamp course metadata parser and course generator - generates a freecodecamp_courses.json  
 * file with all of the metadata needed to drive the Topcoder Academy API and wrapper around the 
 * fcc.org course execution/code editor tool.
 * 
 * Curriculum data is spread across multiple files, including a curriculum.json file
 * that is generated from Markdown files via the build:curriculum script and the 
 * localized intro.js files. 
 */

const { Console } = require('console');
const {
    learnerLevels,
    PROVIDER_FREECODECAMP
} = require('../../common/constants');
const fs = require('fs');
const { get } = require('lodash')
const logger = require('../../common/logger')
const helper = require('../../common/helper');
const db = require('../../../src/db/models');
const fccCourseSkills = require('../../../src/db/models/fcc_course_skills.json');

const FreeCodeCampGenerator = require('./freeCodeCamp/parserGenerator');

let certCategories, fccCerts;

const args = process.argv

async function getFccResourceProvider() {
    const provider = await db.ResourceProvider.findOne({ where: { name: PROVIDER_FREECODECAMP } })
    if (!provider) {
        throw "Could not find FCC ResourceProvider"
    }

    return provider;
}

function getCourseGenerator(provider) {
    let generator;
    switch (provider.name) {
        case 'freeCodeCamp':
            generator = new FreeCodeCampGenerator(provider);
            break;

        default:
            Console.log(`Unknown learning resource provider ${provider.name}`)
            break;
    }

    return generator;
}

async function writeCoursesToDB(courseFile) {
    console.log("\n** Writing course data to Postgres...");
    fccCerts = await db.FreeCodeCampCertification.findAll();

    let courses = [];

    try {
        const generatedCourses = require(courseFile)
        await synchronizeCourseIds(courseFile, generatedCourses);
        const numCourses = get(generatedCourses, 'length');
        logger.info(`Inserting ${helper.pluralize(numCourses, 'course')}`)

        for (let fccCourse of generatedCourses) {
            console.log('** migrating course', fccCourse.key)
            const course = buildCourseAttrs(fccCourse);
            if (course) {
                courses.push(course);
            }
        }
        console.log(`** Bulk inserting ${courses.length} courses`)
        newCourses = await createCourses(courses);
    } catch (e) {
        logger.warn(`An error occurred. No courses will be inserted.`)
        logger.logFullError(e)
    }
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

function buildCourseAttrs(fccCourse) {
    const cert = fccCerts.find(fccCert => fccCert.fccId == fccCourse.certificationId)
    if (!cert) {
        console.error(`Could not find certification with fccId ${fccCourse.certificationId} for course '${fccCourse.title}'`)
        return undefined
    }

    const courseSkills = fccCourseSkills[fccCourse.key]
    if (!courseSkills) {
        console.error(`Could not find skills for course key '${fccCourse.key}'`)
    }

    const courseAttrs = {
        fccCourseUuid: fccCourse.id,
        providerId: fccResourceProvider.id,
        key: fccCourse.key,
        title: fccCourse.title,
        certificationId: cert.id,
        modules: buildModulesAttrs(fccCourse.modules),
        estimatedCompletionTimeValue: fccCourse.estimatedCompletionTime.value,
        estimatedCompletionTimeUnits: fccCourse.estimatedCompletionTime.units,
        introCopy: fccCourse.introCopy,
        note: fccCourse.note,
        keyPoints: fccCourse.keyPoints,
        completionSuggestions: fccCourse.completionSuggestions,
        learnerLevel: learnerLevels.BEGINNER,
        skills: courseSkills,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    return courseAttrs;
}

function buildModulesAttrs(tcaModules) {
    let module;
    let modules = [];

    let order = 0;
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
            order: order++,
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

/**
 * Synchronizes the local IDs of courses with existing course data 
 * stored in the database. This allows updating existing courses and preserves 
 * the course IDs, which are referenced in Certification Progress records.
 * 
 * @param {String} courseFile file path to generated course file
 * @param {Object} generatedCourses generated course data
 */
async function synchronizeCourseIds(courseFile, generatedCourses) {
    console.log("\n** Synchronizing course IDs with Postgres data");

    let saveCourseFile = false;
    const courses = await db.FccCourse.findAll();

    for (var course of generatedCourses) {
        const existingCourse = courses.find(existingCourse => existingCourse.key === course.key);
        if (existingCourse) {
            saveCourseFile = true;
            course.id = existingCourse.id;
            console.log(`** synchronized course ${course.key} ID to ${existingCourse.id}`)
        } else {
            console.log(`** new course ${course.key}`)
        }
    }

    // If the course data was updated with IDs, safe the data file.
    if (saveCourseFile) {
        fs.writeFileSync(courseFile, JSON.stringify(generatedCourses, null, 2));
    }
}

async function writeCertificationsToDB(certificationsFile) {
    console.log("\n** Writing certification data to Postgres...");
    const certifications = [];

    try {
        let fccCerts = require(certificationsFile)
        const numCerts = get(data, 'length');
        logger.info(`Inserting ${helper.pluralize(numCerts, 'certification')}`)

        for (let cert of fccCerts) {
            certifications.push(buildCertificationAttrs(cert))
        }
        console.log(`Bulk inserting ${certifications.length} certifications`)
        await db.FreeCodeCampCertification.bulkCreate(certifications);
    } catch (e) {
        logger.warn(`An error occurred. No certifications will be inserted.`)
        logger.logFullError(e)
    }
}

function buildCertificationAttrs(fccCert) {
    const certCategory = certCategories.find(certCat => certCat.category == fccCert.category)
    if (!certCategory) {
        throw `Could not find certification category ${fccCert.category} -- exiting`
    }

    const certAttrs = {
        fccId: fccCert.id,
        resourceProviderId: fccResourceProvider.id,
        key: fccCert.key,
        providerCertificationId: fccCert.providerCertificationId,
        title: fccCert.title,
        certification: fccCert.certification,
        completionHours: fccCert.completionHours,
        state: fccCert.state,
        certificationCategoryId: certCategory.id,
        certType: fccCert.certType,
        publishedAt: fccCert.publishedAt,
        createdAt: fccCert.createdAt,
        updatedAt: fccCert.updatedAt
    }

    return certAttrs;
}

/**
 * Converts Certification date attributes given in human-readable format to Unix 
 * timestamp with milliseconds for compatibility with Postgres date type.
 * 
 * @param {Object} certData certification data
 */
function convertCertAttrDatesToTimestamps(certData) {
    // get the fields in the model that should be dates
    // based on the field name ending in "At"
    // NOTE: this is a bit of hack since Dynamoose does not 
    // appear to expose the +type+ data specified in the model.
    let dateFields = [];
    const model = models['Certification'];
    const schemaObject = model.schemas['0'].schemaObject;

    const dateKeys = Object.keys(schemaObject);
    dateFields = dateKeys.filter(key => key.endsWith('At'))

    // iterate through the certification records and  
    // convert any date fields
    for (let cert of certData) {
        for (let dateFieldKey of dateFields) {
            let dateField = cert[dateFieldKey];
            if (!!dateField) {
                const dateValue = Date.parse(dateField)
                if (dateValue != NaN) {
                    cert[dateFieldKey] = dateValue
                }
            }
        }
    }
}

/**
 * Updates lesson IDs in a course in Postgres with the corresponding 
 * IDs in the JSON course data, which are taken from the freeCodeCamp
 * curriculum source data.
 * 
 * @param {Object} course JSON course data
 * @param {Object} dbCourse Postgres course data
 */
function updateLessonIds(course, dbCourse) {
    console.log(`\nupdating dbCourse: ${dbCourse.key} (id: ${dbCourse.id})`);
    course.modules.forEach(module => {
        console.log(`-- module: ${module.key}`);
        const dbModule = dbCourse.modules.find(mod => mod.key === module.key);
        if (dbModule) {
            module.lessons.forEach(lesson => {
                let dbLesson = dbModule.lessons.find(less => less.dashedName === lesson.dashedName)
                if (dbLesson) {
                    dbLesson.id = lesson.id;
                } else {
                    console.error(`could not find dbLesson ${lesson.dashedName} -- quitting`);
                    process.exit(1);
                }
            })
            console.log(dbModule.lessons);
        } else {
            console.error(`could not find dbModule ${module.key} -- quitting`);
            process.exit(1);
        }
    })
}

// ----------------- start of CLI -----------------

// Parse CLI flags
const writeToDB = (args.indexOf('-d') > -1 ? true : false);
const writeOnlyCertsToDB = (args.indexOf('-r') > -1 ? true : false);

const provider = getFccResourceProvider();

// Generate the course data for the provider and
// write it to the database if the -d flag is provided.
//
// Also allows just updating the Certification data if the 
// -r flag is provided.
//
if (provider) {
    const generator = getCourseGenerator(provider);
    const generatedCourseFilePath = generator.generateCourseData();
    console.log(`** Courses for ${provider.name} have been written to ${generatedCourseFilePath.toString()}`)

    if (writeToDB) {
        console.log("\nWriting generated course data to the database")
        writeCoursesToDB(generatedCourseFilePath);
        writeCertificationsToDB(generator.certificationsFilePath)
    } else if (writeOnlyCertsToDB) {
        console.log("\nWriting only certification data to the database")
        writeCertificationsToDB(generator.certificationsFilePath)
    }
}
