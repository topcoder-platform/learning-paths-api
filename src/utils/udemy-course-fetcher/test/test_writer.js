'use strict';

const fs = require('fs');
const path = require('path');

const fetcher = require('../fetcher');
const writer = require('../course_writer.js');

const COURSE_FILES_DIR = "course-files";

(async () => {
    // const courseFile = await fetcher.handleCourses();
    const courseFile = 'udemy-courses -2022-11-07T22:16:59.700Z.json'
    const filePath = path.join(__dirname, '..', COURSE_FILES_DIR, courseFile);

    const rawCourseData = JSON.parse(
        fs.readFileSync(filePath)
    );

    await writer.updateCourses(rawCourseData);
})();