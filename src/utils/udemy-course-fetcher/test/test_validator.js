'use strict';

const { exist } = require('joi');
const validator = require('../src/course_update_validator');

(async () => {
    let validUpdate, validationIssue;

    let courses = undefined;
    ({ validUpdate, validationIssue } = await validator.validateInputDataExists(courses));
    console.log('courses undefined', validUpdate, validationIssue);

    courses = [];
    ({ validUpdate, validationIssue } = await validator.validateInputDataExists(courses));
    console.log('courses empty', validUpdate, validationIssue);

    courses = [{ id: 1 }];
    ({ validUpdate, validationIssue } = await validator.validateInputDataExists(courses));
    console.log('1 course', validUpdate, validationIssue);

    let inputCourseCount = 0;
    let existingCourseCount = 0;

    ({ validUpdate, validationIssue } = await validator.validateInputDataSize(inputCourseCount, existingCourseCount));
    console.log('no existing or incoming courses', validUpdate, validationIssue);

    existingCourseCount = 1;
    ({ validUpdate, validationIssue } = await validator.validateInputDataSize(inputCourseCount, existingCourseCount));
    console.log('no incoming courses, 1 existing', validUpdate, validationIssue);

    existingCourseCount = 1000;
    inputCourseCount = 991;
    ({ validUpdate, validationIssue } = await validator.validateInputDataSize(inputCourseCount, existingCourseCount));
    console.log('< delta % difference', validUpdate, validationIssue);

    existingCourseCount = 1000;
    inputCourseCount = 985;
    ({ validUpdate, validationIssue } = await validator.validateInputDataSize(inputCourseCount, existingCourseCount));
    console.log('> delta % difference', validUpdate, validationIssue);

    existingCourseCount = 17072;
    inputCourseCount = 16900;
    ({ validUpdate, validationIssue } = await validator.validateInputDataSize(inputCourseCount, existingCourseCount));
    console.log('> delta % difference', validUpdate, validationIssue);

    const dbCourseCount = await validator.getExistingCourseCount();
    console.log('DB course count', dbCourseCount);

    const forceUpdate = true;
    ({ validUpdate, validationIssue } = await validator.validateCourseUpdate({}, forceUpdate))
    console.log('force', validUpdate, validationIssue)
})();