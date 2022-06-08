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

const FreeCodeCampGenerator = require('./freeCodeCamp/parserGenerator');

const PROVIDERS_FILE = 'providers.json';

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
    const generator = new FreeCodeCampGenerator();
    generator.generateCourseData();
}

// ----------------- start of CLI -----------------

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
    runCourseGenerator(providerName);
}
