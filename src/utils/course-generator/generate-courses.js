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
    // TODO -- do we want to do a wholesale remove and replace operation?
    console.log("Clearing Course table...");
    const courses = await helper.scan('Course')
    console.log(`Deleting ${courses.length} courses...`)
    for (const course of courses) {
        await course.delete()
    }

    console.log("\n** Writing course data to DynamoDB...");
    const promises = []

    try {
        const data = require(courseFile)
        const numCourses = get(data, 'length');
        logger.info(`Inserting ${helper.pluralize(numCourses, 'course')}`)
        promises.push(models.Course.batchPut(data))
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

async function writeCertificationsToDB(certificationsFile) {
    console.log("Clearing Certifications table...");
    const certifications = await helper.scan('Certification')
    for (const certification of certifications) {
        await certification.delete()
    }

    console.log("\n** Writing certification data to DynamoDB...");
    const promises = []

    try {
        const data = require(certificationsFile)
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

// Start with the learning resource providers whose certifications 
// and curriculum we want to make available.
const providers = loadAndIdentifyProviders();

let provider;

// Parse CLI flags
const writeToDB = (args.indexOf('-d') > -1 ? true : false);
const updateIds = (args.indexOf('-u') > -1 ? true : false);

// Parse the CLI args for the provider name, if given
if (args.length == 2 || (args.length == 3 && (writeToDB || updateIds))) {
    provider = loadDefaultProvider(providers);
} else if ((args.length == 3 && !writeToDB) || args.length == 4) {
    const givenProvider = args[2]
    provider = loadSelectedProvider(providers, givenProvider)
} else {
    console.log("Use the default provider or provide one provider name")
    showAvailableProviders(providers);
}

// TODO - need to write the updated providers and/or certifications 
// data to the DB, too.

// Generate the course data for the given provider
// and write it to the database if that flag was provided
if (provider) {
    const generator = getCourseGenerator(provider);
    const generatedCourseFilePath = generator.generateCourseData();
    console.log(`** Courses for ${provider.name} have been written to ${generatedCourseFilePath.toString()}`)

    if (writeToDB) {
        console.log("\nWriting generated course data to the database")
        writeCoursesToDB(generatedCourseFilePath);
        writeCertificationsToDB(generator.certificationsFilePath)
    } else if (updateIds) {
        console.log("\nUpdating freeCodeCamp Course Ids")
        updateCourseLessonIds(generatedCourseFilePath);
    }
}
