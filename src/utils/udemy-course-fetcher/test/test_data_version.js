'use strict';

const CourseVersion = require('../src/course_version');

(async () => {
    const courseVersion = new CourseVersion();
    console.log('version', await courseVersion.currentVersion())
    console.log('create new version', await courseVersion.createNewVersion())
    console.log('version', await courseVersion.currentVersion())
})();