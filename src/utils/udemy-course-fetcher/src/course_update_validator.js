const { PrismaClient } = require('@prisma/client');

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

class CourseUpdateValidator {

    constructor(incomingCourses, existingCourseCount, forceUpdate) {
        this.incomingCourses = incomingCourses;
        this.existingCourseCount = existingCourseCount;
        this.forceUpdate = forceUpdate;
    }

    /**
     * Intializes an instance of the CourseUpdateValidator class with the incoming 
     * and current course counts. Using this approach because we want to avoid having 
     * an +async+ constructor.
     * 
     * @param {Array} courses array of incoming course data
     * @param {Boolean} forceUpdate optional flag to force an update regardless of validation status
     * @returns an instance of the CourseUpdateValidator class
     */
    static async initialize(courses, forceUpdate = false) {
        const existingCourseCount = await this.getExistingCourseCount();

        return new CourseUpdateValidator(courses, existingCourseCount, forceUpdate);
    }

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
    validate() {
        this.validUpdate = false || this.forceUpdate;
        this.validationIssue = this.forceUpdate ? "forced update" : "";

        if (!this.forceUpdate) {
            this.validateCourseUpdate(this.incomingCourses)
        } else {
            console.log("** course validator ran with forced update -- no validation performed **")
        }

        return {
            validUpdate: this.validUpdate,
            validationIssue: this.validationIssue
        }
    }

    /**
     * Validates the incoming course data for existence, size, and 
     * in comparison to existing course data 
     * 
     * @param {Array} courses array of incoming Udemy courses
     */
    validateCourseUpdate(courses) {
        this.validateInputDataExists(courses)

        if (this.validUpdate) {
            this.validateInputDataSize(this.inputCourseCount, this.existingCourseCount)
        }
    }

    /**
     * Validates the input course data exists and contains at least one course 
     * 
     * @param {Array} courses array of Udemy course data
     */
    validateInputDataExists(courses) {
        this.validUpdate = (courses != null && courses.length > 0)
        this.inputCourseCount = courses ? courses.length : 0

        this.validationIssue = this.validUpdate ? "" : "no courses retrieved from API"
    }

    /**
     * Validates that the incoming course data is bigger than the existing course
     * data, or if smaller, that the delta between incoming and existing course counts 
     * is within predetermined limits. 
     * 
     * @param {Integer} inputCourseCount the count of incoming courses
     * @param {Integer} existingCourseCount the count of existing courses
     */
    validateInputDataSize(inputCourseCount, existingCourseCount) {
        console.log(`validating ${inputCourseCount} incoming courses and ` +
            `${existingCourseCount} existing courses`)

        // if there are no existing courses to overwrite, or if the 
        // count of incoming courses is greater than the existing count,
        // the update is considered valid
        if (existingCourseCount == 0 || inputCourseCount >= existingCourseCount) {
            this.validUpdate = true
        }

        // otherwise, we need to check to be sure we're not going to 
        // just clobber all the existing courses with an unreasonably
        // small update
        if (inputCourseCount < existingCourseCount) {
            const deltaCount = existingCourseCount - inputCourseCount;
            const delta = (deltaCount / existingCourseCount) * 100;

            if (delta > MAX_COURSE_COUNT_REDUCTION_PERCENT_DELTA) {
                this.validUpdate = false;
                this.validationIssue = `Incoming course count (${inputCourseCount}) is ` +
                    `less than existing course count (${existingCourseCount}) ` +
                    `by ${delta.toFixed(2)}% (${deltaCount} courses), ` +
                    `beyond the limit of a ${MAX_COURSE_COUNT_REDUCTION_PERCENT_DELTA.toFixed(2)}% reduction`
            } else {
                this.validUpdate = true
            }
        } else {
            this.validUpdate = true
        }
    }

    /**
     * Gets the count of existing Udemy courses
     * @returns integer count of the existing number of courses
     */
    static async getExistingCourseCount() {
        try {
            return await prisma.udemyCourse.count();
        } catch (error) {
            throw error
        }
    }
}

module.exports = CourseUpdateValidator