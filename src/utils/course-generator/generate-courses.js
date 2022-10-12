#!/usr/bin/env node

'use strict';

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
const fs = require('fs');
const { get } = require('lodash')
const logger = require('../../common/logger')
const helper = require('../../common/helper');
const models = require('../../models');
const path = require('path');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const FreeCodeCampGenerator = require('./freeCodeCamp/parserGenerator');

const PROVIDERS_FILE = 'providers.json';
const STATUS_IN_PROGRESS = "in-progress";

const args = process.argv

function providersPath() {
    return path.join(__dirname, PROVIDERS_FILE);
}

function loadProviders() {
    let providers = JSON.parse(fs.readFileSync(providersPath()));
    validateProviders(providers);

    return providers;
}

function validateProviders(providers) {
    const providerNames = providers.map(provider => provider.name);
    const uniqueProviders = new Set(providerNames);
    const filteredProviders = providerNames.filter(provider => {
        if (uniqueProviders.has(provider)) {
            uniqueProviders.delete(provider);
        } else {
            return provider;
        }
    });

    const duplicateProviders = [...new Set(filteredProviders)]
    if (duplicateProviders.length > 0) {
        throw `Duplicate provider name(s) found: ${duplicateProviders.join(', ')}`;
    }
}

function loadAndIdentifyProviders() {
    let providers = loadProviders();

    // bail if we have no providers (error handling TBD)
    if (!providers || providers.length == 0) {
        return [];
    }

    let dirty = false;

    // check to be sure each provider has a UUID and
    // set it if not.
    providers.forEach(provider => {
        if (!uuidValidate(provider.id)) {
            provider.id = uuidv4();
            dirty = true;
        }
    })

    if (dirty) {
        // if the providers were updated, write the data back to JSON
        fs.writeFileSync(providersPath(), JSON.stringify(providers, null, 2));
    }

    return providers;
}

function loadDefaultProvider(providers) {
    if (!providers || providers.length == 0) {
        throw "Cannot load a default learning resource provider"
    } else {
        return providers[0]
    }
}

function loadSelectedProvider(providers, givenProvider) {
    if (!providers || providers.length == 0) {
        throw `Cannot load given provider '${givenProvider}'`
    } else {
        const provider = providers.find(provider => provider.name == givenProvider);
        if (provider) {
            return provider
        } else {
            console.log(`Could not load provider '${givenProvider}'`)
            showAvailableProviders(providers);
            return null;
        }
    }
}

function showAvailableProviders(providers) {
    console.log("\nAvailable learning resource providers:");
    providers.forEach(provider => {
        console.log(`  - ${provider.name}`)
    })
    console.log('\n')
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
    console.log("\n** Writing course data to DynamoDB...");
    const promises = []

    try {
        const generatedCourses = require(courseFile)
        await synchronizeCourseIds(courseFile, generatedCourses);
        const numCourses = get(generatedCourses, 'length');
        logger.info(`Inserting ${helper.pluralize(numCourses, 'course')}`)
        promises.push(models.Course.batchPut(generatedCourses))
    } catch (e) {
        logger.warn(`An error occurred. No courses will be inserted.`)
        logger.logFullError(e)
    }

    Promise.all(promises)
        .then(() => {
            logger.info('All course data has been inserted. The processes is run asynchronously')
        })
        .catch((err) => {
            logger.logFullError(err)
        })
}

/**
 * Synchronizes the local IDs of courses with existing course data 
 * stored in DynamoDB. This allows updating existing courses and preserves 
 * the course IDs, which are referenced in Certification Progress records.
 * 
 * @param {String} courseFile file path to generated course file
 * @param {Object} generatedCourses generated course data
 */
async function synchronizeCourseIds(courseFile, generatedCourses) {
    console.log("\n** Synchronizing course IDs with DynamoDB data");

    let saveCourseFile = false;
    const courses = await helper.scanAll('Course')

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
    console.log("\n** Writing certification data to DynamoDB...");
    const promises = []

    try {
        let data = require(certificationsFile)
        convertCertAttrDatesToTimestamps(data)
        const numCerts = get(data, 'length');
        logger.info(`Inserting ${helper.pluralize(numCerts, 'certification')}`)
        promises.push(models.Certification.batchPut(data))
    } catch (e) {
        logger.warn(`An error occurred. No certifications will be inserted.`)
        logger.logFullError(e)
    }

    Promise.all(promises)
        .then(() => {
            logger.info('All certification data has been inserted. The processes is run asynchronously')
        })
        .catch((err) => {
            logger.logFullError(err)
        })
}

/**
 * Converts Certification date attributes given in human-readable format to Unix 
 * timestamp with milliseconds for compatibility with DynamoDB date type.
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
 * Adds an ID attribute to all of the database copy of all of the 
 * lessons in all of the modules in all of the courses listed in the 
 * generated courses file. 
 * 
 * It preserves the existing course IDs in the database course data so 
 * as not to break the link to any existing certification progress 
 * records.
 * 
 * The database this targets is dependent on the DYNAMODB_URL env var!
 * 
 * @param {String} courseFile the path to the local generated courses file
 */
async function updateCourseLessonIds(courseFile) {
    console.log("Updating Course IDs from", courseFile);

    // get the course data from the generated local file and 
    // the DynamoDB
    const courseData = require(courseFile)
    const courses = await helper.scanAll('Course');

    courseData.forEach(async course => {
        const courseKey = course.key;
        const dbCourse = courses.find(course => course.key == courseKey);
        if (dbCourse) {
            updateLessonIds(course, dbCourse);
            await dbCourse.save();
            console.log(`\nsaved dbCourse ${dbCourse.key}`);
        } else {
            console.error(`Could not find DB course with key ${courseKey} -- quitting`);
            process.exit(1);
        }
    })
}

/**
 * Updates lesson IDs in a course in DynamoDB with the corresponding 
 * IDs in the JSON course data, which are taken from the freeCodeCamp
 * curriculum source data.
 * 
 * @param {Object} course JSON course data
 * @param {Object} dbCourse DynamoDB course data
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

/**
 * Updates DynamoDB CertificationProgress completed lesson IDs with the corresponding
 * IDs stored in the Course table.
 */
async function updateCertProgressLessonIds(dryRun = false) {
    const msg = "Updating CertificationProgress lesson IDs in DynamoDB"
    const dryRunMsg = dryRun ? " -- DRY RUN (no data updates will be made)" : ""

    console.log(`\n${msg}${dryRunMsg}`)

    const courses = await helper.scanAll('Course');
    const progresses = await helper.scanAll('CertificationProgress');

    console.log(`Found ${progresses.length} CertificationProgress records to check`);

    progresses.forEach(async progress => {
        console.log(`\nchecking progress for user ${progress.userId} certification ${progress.certification}`)
        const course = courses.find(crs => crs.id === progress.courseId)
        if (course) {
            const didUpdate = updateProgressWithCourseLessonIds(progress, course);
            if (didUpdate) {
                if (!dryRun) {
                    await progress.save();
                    console.log(`...updated progress ${progress.id}`)
                } else {
                    console.log(`...DRY RUN -- would have updated ${progress.id}`)
                }
            } else {
                console.log("...no updates needed")
            }
        } else {
            console.error(`could not find course matching ID ${progress.courseId} -- quitting`);
            process.exit(1);
        }
    })
}

/**
 * Updates course progress completed lesson IDs to their corresponding ID
 * in the course data.
 * 
 * @param {Object} progress A Dynamoose CertificationProgress object
 * @param {Object} course A Dynamoose Course object
 */
function updateProgressWithCourseLessonIds(progress, course) {
    let didUpdateLesson = false;

    progress.modules.forEach(progressModule => {
        const progressModuleName = progressModule.module;
        const courseModule = course.modules.find(module => module.key === progressModuleName)
        if (!courseModule) {
            console.error(`could not find course module ${progressModuleName} -- quitting`);
            process.exit(1);
        }

        if (progressModule.status == STATUS_IN_PROGRESS) {
            progressModule.completedLessons.forEach(completedLesson => {
                const completedLessonName = completedLesson.dashedName;
                const courseLesson = courseModule.lessons.find(lesson => lesson.dashedName === completedLessonName)
                if (!courseLesson) {
                    console.error(`could not find course lesson ${completedLessonName} -- quitting`);
                    process.exit(1);
                }

                // Set the completed lesson ID in the certification progress 
                // to match the course lesson ID
                if (completedLesson.id != courseLesson.id) {
                    completedLesson.id = courseLesson.id;
                    didUpdateLesson = true;
                }
            })
        }
    })

    return didUpdateLesson;
}

/**
 * Updates DynamoDB CertificationProgress modules with explicit +isAssessment+ 
 * attribute from updated course data.
 */
async function updateCertProgressAssessmentModules() {
    console.log("\nUpdating CertificationProgress assessment modules in DynamoDB")

    const courses = await helper.scanAll('Course');
    const progresses = await helper.scanAll('CertificationProgress');

    console.log(`Found ${progresses.length} CertificationProgress records to update`);

    progresses.forEach(async progress => {
        console.log(`\nupdating progress for user ${progress.userId} certification ${progress.certification}`)
        const course = courses.find(crs => crs.id === progress.courseId)
        if (course) {
            updateProgressModulesWithAssessmentAttr(progress, course);
            await progress.save();
            console.log(`...updated progress ${progress.id}`)
        } else {
            console.error(`could not find course matching ID ${progress.courseId} -- quitting`);
            process.exit(1);
        }
    })
}

/**
 * Updates course progress modules with an explicit +isAssessment+
 * attribute to simplify certification completion verification.
 * 
 * @param {Object} progress A Dynamoose CertificationProgress object
 * @param {Object} course A Dynamoose Course object
 */
function updateProgressModulesWithAssessmentAttr(progress, course) {
    progress.modules.forEach(progressModule => {
        const progressModuleName = progressModule.module;
        const courseModule = course.modules.find(module => module.key === progressModuleName)
        if (!courseModule) {
            console.error(`could not find course module ${progressModuleName} -- quitting`);
            process.exit(1);
        }

        // Set the isAssessment attribute to match what's in the course data
        progressModule.isAssessment = courseModule.meta.isAssessment;
    })
}

// ----------------- start of CLI -----------------

// Start with the learning resource providers whose certifications 
// and curriculum we want to make available.
const providers = loadAndIdentifyProviders();

let provider;

// Parse CLI flags
const writeToDB = (args.indexOf('-d') > -1 ? true : false);
const writeOnlyCertsToDB = (args.indexOf('-r') > -1 ? true : false);
const updateDBLessonIds = (args.indexOf('-u') > -1 ? true : false);
const updateDBProgressIds = (args.indexOf('-p') > -1 ? true : false);
const updateDBModuleAssessments = (args.indexOf('-m') > -1 ? true : false);
const dryRun = (args.indexOf('-y') > -1 ? true : false);

// Parse the CLI args for the provider name, if given
if (args.length == 2 ||
    (args.length == 3 &&
        (writeToDB || writeOnlyCertsToDB || updateDBLessonIds || updateDBProgressIds || updateDBModuleAssessments)) ||
    (args.length == 4 && dryRun)) {
    provider = loadDefaultProvider(providers);
} else if ((args.length == 3 && !(writeToDB || writeOnlyCertsToDB)) || args.length == 4) {
    const givenProvider = args[2]
    provider = loadSelectedProvider(providers, givenProvider)
} else {
    console.log("Use the default provider or provide one provider name")
    showAvailableProviders(providers);
}

// TODO - need to write the updated providers and/or certifications 
// data to the DB, too.

// Generate the course data for the given provider and
// write it to the database if the -d flag is provided.
//
// Also allows just updating the Certification data if the 
// -r flag is provided.
//
// Additional tools added:
// =======================
// - updateCourseLessonIds: update course lessons stored in DynamoDB 
//   with the corresponding freeCodeCamp ID (designed to be used once, leaving in for posterity)
//
// - updateCertProgressLessonIds: update certification progress completed 
//   lessons with IDs in the course lessons (designed to be used once, leaving in for posterity)
//
// - updateDBModuleAssessment: updates course modules to explicitly indicate 
//   which modules are assessments (designed to be used once, leaving in for posterity)
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
    } else if (updateDBLessonIds) {
        updateCourseLessonIds(generatedCourseFilePath);
    } else if (updateDBProgressIds) {
        updateCertProgressLessonIds(dryRun)
    } else if (updateDBModuleAssessments) {
        updateCertProgressAssessmentModules()
    }
}
