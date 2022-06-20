#!/usr/bin/env node

'use strict';

/**
 * freeCodeCamp course metadata parser/builder - generates a freecodecamp_courses.json file 
 * with all of the metadata needed to drive the Topcoder Academy API and wrapper around the 
 * fcc.org course execution/code editor tool.
 * 
 * Curriculum data is spread across multiple files, including a curriculum.json file
 * that is generated from Markdown files via the build:curriculum script and the 
 * localized intro.js files. 
 */

const { Console } = require('console');
const fs = require('fs');
// const helper = require('../../common/helper');
const models = require('../../models');
const path = require('path');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const FreeCodeCampGenerator = require('./freeCodeCamp/parserGenerator');

const PROVIDERS_FILE = 'providers.json';

const args = process.argv

function providersPath() {
    return path.join('./', PROVIDERS_FILE);
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

function runCourseGenerator(provider) {
    let generator;
    switch (provider) {
        case 'freeCodeCamp':
            generator = new FreeCodeCampGenerator();
            break;

        default:
            Console.log(`Unknown learing resource provider ${provider}`)
            break;
    }

    const generatedFile = generator.generateCourseData();
    console.log(`** Courses for ${provider} have been written to ${generatedFile.toString()}`)

    return generatedFile;
}

function writeCoursesToDB(courseFile) {
    // TODO -- do we want to do a wholesale remove and replace operation?
    console.log("Clearing Course table...");
    // const courses = await helper.scan('Course')
    // for (const course of courses) {
    //     await course.delete()
    // }

    console.log("\n** Writing course data to DynamoDB...");
    const promises = []

    try {
        const data = require(courseFile)
        logger.info(`Inserting ${get(data, 'length')} courses`)
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

// ----------------- start of CLI -----------------

// Start with the learning resource providers whose certifications 
// and curriculum we want to make available.
const providers = loadAndIdentifyProviders();

let provider;

// Parse CLI flags
const writeToDB = (args.indexOf('-d') > -1 ? true : false);

// Parse the CLI args for the provider name, if given
if (args.length == 2 || (args.length == 3 && writeToDB)) {
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
    const courseFile = runCourseGenerator(provider.name);
    if (writeToDB) {
        writeCoursesToDB(courseFile);
    }
}
