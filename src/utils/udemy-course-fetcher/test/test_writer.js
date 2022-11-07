'use strict';

const fs = require('fs');
const path = require('path');

const fetcher = require('../fetcher');
const writer = require('../course_writer.js');

const COURSE_FILES_DIR = "course-files";

(async () => {
    // const courseFile = await fetcher.handleCourses();
    const courseFile = 'udemy-courses-2022-11-03T23:54:13.485Z.json'
    const filePath = path.join(__dirname, '..', COURSE_FILES_DIR, courseFile);

    const rawCourseData = JSON.parse(
        fs.readFileSync(filePath)
    );

    await writer.updateCourses(rawCourseData);
})();