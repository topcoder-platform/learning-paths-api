
const certProgressService = require('./CertificationProgressService')
const courseService = require('./CourseService')
const freeCodeCampService = require('./FreeCodeCampDataService')
const helper = require('../common/helper')

/**
 * Automatically completes a freeCodeCamp course that has been started by a user. A course is 
 * completed by:
 *  - marking the lessons completed in FCC's MongoDB instance by:
 *    - adding a progress timestamp for each completed lesson
 *    - adding a completed challenge entry for each lesson
 * - allowing the MongoDB lesson completion trigger update the DynamoDB certification
 *   progress record 
 * 
 * @param {String} certificationProgressId the ID of the certification progress record to complete
 * @param {String} authUserId the user ID of the requesting user, who owns the cert progress record
 * @returns the completed CertificationProgress record
 */
async function shortcutCompleteFccCourse(certificationProgressId, authUserId) {
    let certProgress = await helper.getByIdAndUser('CertificationProgress', certificationProgressId, authUserId)

    if (certProgress.status == 'completed') {
        console.log(`User ${authUserId} has already completed cert progress ${certificationProgressId} -- skipping`);
        return;
    }

    if (certProgress) {
        console.log(`Auto-completing cert progress ${certificationProgressId} for user ${authUserId}`)
        await autocompleteCourse(certProgress)
    }
}

/**
 * Updates the MongoDB user record to complete a specific freeCodeCamp course 
 * 
 * @param {String} certProgress the id of the Certification Progress record to complete
 */
async function autocompleteCourse(certProgress) {
    const userExternalId = `auth0|${certProgress.userId}`;

    const lessonIds = await lessonIdsToComplete(certProgress);
    const lessonsToComplete = buildLessonsToComplete(lessonIds);
    const lessonTimestamps = buildLessonTimestamps(lessonsToComplete);

    return await freeCodeCampService.addCompletedLessons(userExternalId, lessonsToComplete, lessonTimestamps);
}

/**
 * Creates a list of lesson IDs that need to be completed to complete a course
 * 
 * @param {Object} certProgress Certification Progress record of course to complete
 * @returns array of lesson IDs to complete 
 */
async function lessonIdsToComplete(certProgress) {
    const completedLessonIds = certProgressService.mapCompletedLessonIds(certProgress);
    const courseLessonMap = await courseService.courseLessonMap(certProgress.courseId);
    const courseLessonIds = Object.keys(courseLessonMap);

    const lessonIdsToComplete = courseLessonIds.filter(lesson => !completedLessonIds.includes(lesson));
    const msg = `User ${certProgress.userId} completed ${completedLessonIds.length} of ${courseLessonIds.length} lessons, autocompleting ${lessonIdsToComplete.length}`;
    console.info(msg);

    return lessonIdsToComplete;
}

/**
 * Builds an array of lesson objects to write to MongoDB to complete a course 
 * 
 * @param {Array} lessonIds an array of lesson IDs
 * @returns an array of objects representing lessons to be completed in MongoDB
 */
function buildLessonsToComplete(lessonIds) {
    let timestamp = Date.now();
    const completedLessons = lessonIds.map((id, index) => {
        return {
            id: id,
            completedDate: timestamp + index
        }
    })

    return completedLessons
}

/**
 * Builds an array of lesson completion timestamps to write to MongoDB
 * 
 * @param {Array} lessons an array of lesson objects
 * @returns an array of completion timestamps
 */
function buildLessonTimestamps(lessons) {
    return lessons.map(lesson => lesson.completedDate);
}

module.exports = {
    shortcutCompleteFccCourse
}