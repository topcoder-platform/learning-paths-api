const { PrismaClient } = require('@prisma/client');
const { exist } = require('joi');

const prisma = new PrismaClient()

// The maximum valid percentage decrease in incoming course count 
// compared to the current course count, to prevent a bad (partial)
// course data update from causing us to delete a large number of 
// current courses
//
// TODO: maybe ask Udemy what the max # of courses they remove on
// any given update so we can dial this in better? 1% is currently
// a guess, and would represent about 170 courses being removed from 
// the current list of 17k in Udemy Business.
const MAX_COURSE_COUNT_REDUCTION_PERCENT_DELTA = 1.0;

/**
 * Examines the incoming course data and compares it to the current set 
 * of course data to determine if the update is valid. The checks it performs
 * are:
 *   - If there is no incoming data, the update is INVALID
 *   - If the incoming data is significantly smaller than the existing data, 
 *     the update is INVALID
 *   - If there is no existing data, than any update that contains courses 
 *     is VALID
 *   - If the incoming course count is less than the existing course count 
 *     by some predefined %, the update is INVALID
 * 
 * The +forceUpdate+ param is included for cases when we want to perform 
 * a course update and skip any validations.
 * 
 * @param {Array} courses array of JSON course objects from the Udemy API
 * @returns an object with the validation status and a description of the 
 *          validation issue discovered (including a forced update)
 */
async function validateCourseUpdate(courses, forceUpdate = false) {
    let validUpdate = false || forceUpdate;
    let validationIssue = forceUpdate ? "forced update" : "";

    if (!forceUpdate) {
        ({ validUpdate, validationIssue } = await validate(courses))
    }

    return { validUpdate, validationIssue }
}

/**
 * Validates the incoming course data for existence, size, and 
 * in comparison to existing course data 
 * 
 * @param {Array} courses array of incoming Udemy courses
 * @returns object with validation status and description of issue if invalid
 */
async function validate(courses) {
    let validUpdate, validationIssue;

    ({ validUpdate, validationIssue } = validateInputDataExists(courses))

    if (validUpdate) {
        const inputCourseCount = courses.length;
        const existingCourseCount = await getExistingCourseCount();
        ({ validUpdate, validationIssue } = await validateInputDataSize(inputCourseCount, existingCourseCount))
    }

    return {
        validUpdate: validUpdate,
        validationIssue: validationIssue
    }
}

/**
 * Validates the input course data exists and has at least one course 
 * 
 * @param {Array} courses array of Udemy course data
 * @returns object with validation status and description of issue if invalid
 */
function validateInputDataExists(courses) {
    const validUpdate = (courses != null && courses.length > 0)
    const validationIssue = validUpdate ? "" : "no courses retrieved from API"

    return {
        validUpdate: validUpdate,
        validationIssue: validationIssue
    }
}

/**
 * Validates that the incoming course data is bigger than the existing course
 * data, and if smaller, that the delta between incoming and existing course counts 
 * is within predetermined limits. 
 * 
 * @param {Integer} inputCourseCount the count of incoming courses
 * @param {Integer} existingCourseCount the count of existing courses
 * @returns object with validation status and description of issue if invalid
 */
async function validateInputDataSize(inputCourseCount, existingCourseCount) {
    let validUpdate = false;
    let validationIssue = "";

    // if there are no existing courses to overwrite, or if the 
    // count of incoming courses is greater than the existing count,
    // the update is considered valid
    if (existingCourseCount == 0 || inputCourseCount >= existingCourseCount) {
        validUpdate = true
    }

    // otherwise, we need to check to be sure we're not going to 
    // just clobber all the existing courses with an unreasonably
    // small update
    if (!validUpdate) {
        if (inputCourseCount < existingCourseCount) {
            const deltaCount = existingCourseCount - inputCourseCount;
            const delta = (deltaCount / existingCourseCount) * 100;

            if (delta > MAX_COURSE_COUNT_REDUCTION_PERCENT_DELTA) {
                validUpdate = false;
                validationIssue = `Incoming course count (${inputCourseCount}) is ` +
                    `less than existing course count (${existingCourseCount}) ` +
                    `by ${delta.toFixed(2)}% (${deltaCount} courses), ` +
                    `beyond the limit of a ${MAX_COURSE_COUNT_REDUCTION_PERCENT_DELTA.toFixed(2)}% reduction`
            } else {
                validUpdate = true
            }
        } else {
            validUpdate = true
        }
    }

    return {
        validUpdate: validUpdate,
        validationIssue: validationIssue
    }
}

/**
 * Gets the count of existing Udemy courses
 * @returns integer count of the existing number of courses
 */
async function getExistingCourseCount() {
    return await prisma.udemyCourse.count();
}

module.exports = {
    getExistingCourseCount,
    validateCourseUpdate,
    validateInputDataExists,
    validateInputDataSize
}