'use strict';

const { exist } = require('joi');
const CourseUpdateValidator = require('../src/course_update_validator');

(async () => {
    let validUpdate, validationIssue;

    let courses = undefined;
    let validator = new CourseUpdateValidator(courses);

    validator.validateInputDataExists();
    console.log('courses undefined', validator.validUpdate, validator.validationIssue);

    courses = [];
    validator = new CourseUpdateValidator(courses);
    validator.validateInputDataExists(courses);
    console.log('courses empty', validator.validUpdate, validator.validationIssue);

    courses = [{ id: 1 }];
    validator.validateInputDataExists(courses);
    console.log('1 course', validator.validUpdate, validator.validationIssue);

    let inputCourseCount = 0;
    let existingCourseCount = 0;

    validator.validateInputDataSize(inputCourseCount, existingCourseCount);
    console.log('no existing or incoming courses', validator.validUpdate, validator.validationIssue);

    existingCourseCount = 1;
    validator.validateInputDataSize(inputCourseCount, existingCourseCount);
    console.log('no incoming courses, 1 existing', validator.validUpdate, validator.validationIssue);

    existingCourseCount = 1000;
    inputCourseCount = 991;
    validator.validateInputDataSize(inputCourseCount, existingCourseCount);
    console.log('< delta % difference should be true', validator.validUpdate, validator.validationIssue);

    existingCourseCount = 1000;
    inputCourseCount = 985;
    validator.validateInputDataSize(inputCourseCount, existingCourseCount);
    console.log('> delta % difference should be false', validator.validUpdate, validator.validationIssue);

    existingCourseCount = 17072;
    inputCourseCount = 16900;
    validator.validateInputDataSize(inputCourseCount, existingCourseCount);
    console.log('> delta % difference', validator.validUpdate, validator.validationIssue);

    validator = await CourseUpdateValidator.initialize([{}]);
    const validation = validator.validate();
    console.log('validation', validation);
})();