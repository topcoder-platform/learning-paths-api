'use strict';

const fetcher = require('../fetcher');
const writer = require('../course_writer.js');

(async () => {
    // const courseFile = await fetcher.handleCourses();
    const courseFile = 'udemy-courses-2022-11-03T23:54:13.485Z.json'
    await writer.updateCourses(courseFile);
})();