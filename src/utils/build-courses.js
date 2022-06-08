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

const fs = require('fs');
const path = require('path');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

const PROVIDERS_FILE = 'providers.json';
const CERTIFICATIONS_FILE = 'certifications.json';
const CURRICULUM_FILE = 'curriculum.json';
const INTRO_FILE = 'intro.json';
const COURSES_FILE = 'courses.json';
const ACTIVE_CERT_STATE = 'active'

const args = process.argv

function providersPath() {
    return path.join('./', PROVIDERS_FILE);
}

function loadProviders() {
    return JSON.parse(fs.readFileSync(providersPath()));
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

function loadAndIdentifyActiveCertifications(provider) {
    const certPath = path.join('./', provider, CERTIFICATIONS_FILE);
    const certifications = JSON.parse(fs.readFileSync(certPath));

    let dirty = false;

    // check to be sure each certification has a UUID and
    // set it if not.
    certifications.forEach(cert => {
        if (!uuidValidate(cert.id)) {
            cert.id = uuidv4();
            dirty = true;
        }
    })

    if (dirty) {
        // if the certifications were updated, write the data back to JSON
        fs.writeFileSync(certPath, JSON.stringify(certifications, null, 2));
    }

    return certifications.filter(cert => cert.state == ACTIVE_CERT_STATE);
}

function generateCourseData(provider) {
    console.log(`Generating learning path course data for provider ${provider}...`);

    const certifications = loadAndIdentifyActiveCertifications(provider);
    // const certificationCourseMap = buildCertificationCourseMap(certifications);
    const curriculumData = loadCurriculumData(provider);

    const rawCourses = loadRawCourses(provider, certifications, curriculumData);
    buildCourses(provider, rawCourses);
}

// Loads the curriculum and introductory description data 
function loadCurriculumData(provider) {
    const curriculumPath = path.join('./', provider, CURRICULUM_FILE);
    let rawCurriculum = fs.readFileSync(curriculumPath);
    const curriculum = JSON.parse(rawCurriculum);

    const introPath = path.join('./', provider, INTRO_FILE);
    let rawIntro = fs.readFileSync(introPath);
    const intro = JSON.parse(rawIntro);

    return { curriculum, intro }
}

function loadRawCourses(provider, certifications, curriculumData) {
    const { curriculum, intro } = curriculumData;

    let rawCourses;
    certifications.forEach(certification => {
        const courseKeys = certification.courses;

        rawCourses = courseKeys.map(key => {
            const courseIntro = intro[key];

            return {
                id: uuidv4(),
                provider: provider,
                key: key,
                title: courseIntro.title,
                certification: certification.certification,
                completionHours: certification.completionHours,
                introCopy: courseIntro.intro,
                note: courseIntro.note,
                modules: [],
                blocks: curriculum[key].blocks,
                blockIntros: courseIntro.blocks
            }
        });
    });

    return rawCourses;
}

function parseModuleMeta(meta, blockIntro) {
    return {
        name: meta.name,
        dashedName: meta.dashedName,
        order: meta.order,
        estimatedCompletionTime: parseCompletionTime(meta.time),
        introCopy: blockIntro,
        lessonCount: meta.challengeOrder.length
    }
}

function parseCompletionTime(completionTime) {
    const timeParts = completionTime.split(' ');
    return {
        value: timeParts[0],
        units: timeParts[1]
    }
}

function parseChallenges(challenges) {
    const parsedChallenges = challenges.map(challenge => {
        return parseChallenge(challenge)
    })

    return parsedChallenges.sort(compareChallenges)
}

function compareChallenges(a, b) {
    const a_value = a.order
    const b_value = b.order;

    if (a_value < b_value) {
        return -1;
    }
    if (a_value > b_value) {
        return 1;
    }
    return 0;
}

function parseChallenge(challenge) {
    return {
        id: challenge.id,
        title: challenge.title,
        dashedName: challenge.dashedName,
        order: challenge.challengeOrder
    }
}

function buildCourses(provider, rawCourses) {
    rawCourses.forEach(course => {
        course.modules = [];

        const blockIntros = course.blockIntros;

        for (const [key, block] of Object.entries(course.blocks)) {
            const meta = block.meta;

            const module = {
                key: meta.dashedName || key,
                meta: parseModuleMeta(meta, blockIntros[key].intro),
                lessons: parseChallenges(block.challenges)
            }
            course.modules.push(module);
        }

        // sort the modules in the order they should be shown
        course.modules.sort(compareModules);

        // remove the raw curriculum data that's no longer needed
        delete course.blocks;
        delete course.blockIntros;
    })

    // Write out the courses to JSON
    const coursesFilePath = path.join('./', provider, COURSES_FILE);
    fs.writeFileSync(coursesFilePath, JSON.stringify(rawCourses, null, 2));
    console.log(`Courses for ${provider} have been written to ${coursesFilePath.toString()}`)
}

function compareModules(a, b) {
    const a_value = a.meta.order;
    const b_value = b.meta.order;

    if (a_value < b_value) {
        return -1;
    }
    if (a_value > b_value) {
        return 1;
    }
    return 0;
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

// start of CLI 

// Start with the learning resource providers whose certifications 
// and curriculum we have available.
const providers = loadAndIdentifyProviders();

let provider;
let providerName;

// Parse the CLI args for the provider name, if given
if (args.length == 2) {
    provider = loadDefaultProvider(providers);
} else if (args.length == 3) {
    const givenProvider = args[2];
    provider = loadSelectedProvider(providers, givenProvider)
} else {
    console.log("Use the default provider or provide one provider name")
    showAvailableProviders(providers);
}

// Load the course data for the given provider
if (provider) {
    providerName = provider.name;
    generateCourseData(providerName);
}
