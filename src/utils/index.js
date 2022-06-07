'use strict';

/**
 * freeCodeCamp course metadata parser - generates a course.json file with all of 
 * the metadata needed to drive the Topcoder Academy wrapper around the fcc.org 
 * course execution/code editor tool.
 * 
 * Curriculum data is spread across multiple files, including a curriculum.json file
 * that is generated from Markdown files via the build:curriculum script and the 
 * localized intro.js files. 
 */

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let rawIntro = fs.readFileSync('./test-data/intro.json');
let intro = JSON.parse(rawIntro);

let rawCurriculum = fs.readFileSync('./test-data/curriculum.json');
let curriculum = JSON.parse(rawCurriculum);

const rawCerts = curriculum.certifications.blocks;

const certificationKeys = ['responsive-web-design-certification'];
const certifications = certificationKeys.map(key => rawCerts[key])

const courseKeys = ['2022/responsive-web-design']
const courses = courseKeys.map(key => {
    const courseIntro = intro[key];

    return {
        id: uuidv4(),
        provider: "freeCodeCamp",
        key: key,
        title: courseIntro.title,
        certification: "responsive-web-design",
        completionHours: 300,
        introCopy: courseIntro.intro,
        note: courseIntro.note,
        modules: [],
        blocks: curriculum[key].blocks,
        blockIntros: courseIntro.blocks
    }
});

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

courses.forEach(course => {
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

    course.moduleCount = course.modules.length;

    // sort the modules in the order they should be shown
    course.modules.sort(compareModules);

    delete course.blocks;
    delete course.blockIntros;

    console.log(course);
    console.log(JSON.stringify(course.modules[0], null, 2));
})

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
