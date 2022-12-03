
const certProgressService = require('./CertificationProgressService')
const courseService = require('./CourseService')
const freeCodeCampService = require('./FreeCodeCampDataService')
const helper = require('../common/helper')

/**
 * Automatically completes a freeCodeCamp course that has been started by a user. A course is 
 * completed by:
 *  - completing all of the lessons in all of the modules in the course (adding an entry
 *      to each module's +completedLessons+ array for every lesson in every module in the course)
 *  - marking every module as completed
 *  - marking the certification progress as completed
 *  - marking the lessons completed in FCC's MongoDB instance by:
 *    - adding a progress timestamp for each completed lesson
 *    - adding a completed challenge entry for each lesson
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
        await autocompleteCourse(certProgress)
    }
}

async function autocompleteCourse(certProgress) {
    const userExternalId = `auth0|${certProgress.userId}`;

    const lessonIds = await lessonIdsToComplete(certProgress);
    const lessonsToComplete = buildLessonsToComplete(lessonIds);
    const lessonTimestamps = buildLessonTimestamps(lessonsToComplete);

    const result = await freeCodeCampService.addCompletedLessons(userExternalId, lessonsToComplete, lessonTimestamps);
    console.log('mongo result', result);
}

async function lessonIdsToComplete(certProgress) {
    const completedLessonIds = certProgressService.mapCompletedLessonIds(certProgress);
    const courseLessonMap = await courseService.courseLessonMap(certProgress.courseId);
    const courseLessonIds = Object.keys(courseLessonMap);

    const lessonIdsToComplete = courseLessonIds.filter(lesson => !completedLessonIds.includes(lesson));
    const msg = `User ${certProgress.userId} completed ${completedLessonIds.length} of ${courseLessonIds.length} lessons, autocompleting ${lessonIdsToComplete.length}`;
    console.info(msg);

    return lessonIdsToComplete;
}

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

function buildLessonTimestamps(lessons) {
    return lessons.map(lesson => lesson.completedDate);
}

module.exports = {
    shortcutCompleteFccCourse
}