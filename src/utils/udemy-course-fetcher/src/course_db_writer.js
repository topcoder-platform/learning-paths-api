const { PrismaClient } = require('@prisma/client');
const CourseVersion = require('./course_version');

const prisma = new PrismaClient()

async function updateCourses(courseData) {

    const updateResult = replaceCourseData(courseData)
        .then(async (result) => {
            await prisma.$disconnect()
            return result;
        })
        .catch(async (e) => {
            console.error(e)
            await prisma.$disconnect()
        })

    return updateResult;
}

/**
 * Replaces the current course data with a new version, sourced from the 
 * given data file.
 * 
 * The sequence for updating the data is:
 *   1. Get a new data version timestamp
 *   2. Load all of the new data into the DB with that new version
 *   3. Make that new version the current version
 *   4. Delete the course data for the previous (older) version(s)
 * 
 * @param {String} rawCourseData the JSON data making up the courses
 */
async function replaceCourseData(rawCourseData) {
    // update the course data to a new version, as described above
    // TODO: there's probably a way to wrap this in a DB transaction via Prisma
    const courseVersion = new CourseVersion();
    const newVersion = courseVersion.newVersion();

    const courseData = formatRawCourseDataForInput(rawCourseData, newVersion);

    const writeCourseResult = await writeCoursesToTable(courseData);
    const versionUpdateResult = await courseVersion.updateVersion();
    const removeCourseResult = await removePreviousCourseVersions(newVersion);

    return {
        coursesRemoved: removeCourseResult,
        coursesWritten: writeCourseResult,
        versionUpdateResult
    }
}

/**
 * Converts raw Udemy Course data from the API to a format that can be used by 
 * Prisma to create the data in the database. It injects the data version into 
 * each record to allow replacing the existing data with a new version.
 * 
 * @param {Object} rawCourseData the raw JSON course data returned from the API
 * @param {String} dataVersion the data version for the new data
 * @returns the formatted course data as JSON
 */
function formatRawCourseDataForInput(rawCourseData, dataVersion) {
    let inputData = [];

    for (let data of rawCourseData) {
        const record = recordFromRawData(data, dataVersion)
        inputData.push(record)
    }

    return inputData;
}

/**
 * Writes the course data to the database via Prisma
 * 
 * @param {Object} courseData Udemy course data as JSON
 * @returns the count of courses written to the database (the result of the DB write)
 */
async function writeCoursesToTable(courseData) {
    const writeCourses = await prisma.udemyCourse.createMany({ data: courseData })
    return writeCourses
}

/**
 * Removes all course data with a version older than the current (latest) version 
 * 
 * @param {timestamp} currentVersion the current (latest) version of the data
 * @returns the result of the database delete operation (the number of rows deleted)
 */
async function removePreviousCourseVersions(currentVersion) {
    const deleteCourses = await prisma.udemyCourse.deleteMany({
        where: {
            data_version: {
                lt: currentVersion
            }
        }
    })

    return deleteCourses;
}

/**
 * Deletes all of the records in the course table
 * 
 * NOTE: this method is currently unused but is handy to have for maintenance, so 
 * let's leave it for now.
 * 
 * @returns the result of the database delete operation (the number of rows deleted)
 */
async function clearCourseTable() {
    const deleteCourses = await prisma.udemyCourse.deleteMany({})
    return deleteCourses;
}

/**
 * Converts raw API JSON to a format suitable for persisting to the 
 * database via Prisma. Includes a data version value to allow wholesale
 * versioning of the course data.
 * 
 * @param {Object} data a raw Udemy Course API data object
 * @param {timestamp} dataVersion the new data version timestamp 
 * @returns a JSON course object 
 */
function recordFromRawData(data, dataVersion) {
    return {
        id: data.id,
        title: data.title,
        description: data.description,
        headline: data.headline,
        url: data.url,
        categories: data.categories,
        topics: data.topics.map(topic => topic.title),
        promo_video_url: data.promo_video_url,
        instructors: data.instructors,
        requirements: data.requirements.list,
        what_you_will_learn: data.what_you_will_learn.list,
        level: setLearnerLevel(data.level),
        images: data.images,
        locale: data.locale.locale,
        primary_category: data.primary_category?.title,
        primary_subcategory: data.primary_subcategory?.title,
        estimated_content_length: data.estimated_content_length,
        estimated_content_length_video: data.estimated_content_length_video,
        num_lectures: data.num_lectures,
        num_videos: data.num_videos,
        last_update_date: new Date(Date.parse(data.last_update_date)),
        data_version: dataVersion
    }
}

/**
 * Normalizes learner level values to fit the Prisma enum values, 
 * including coercing null or empty values to +All_Levels+ since 
 * the Udemy data has inconsistencies.
 * 
 * @param {String} level the level from the Udemy course object
 * @returns a string representing the learner level
 */
function setLearnerLevel(level) {
    if (level === null ||
        level == '' ||
        level == 'All Levels') return 'All_Levels';

    return level;
}

module.exports = {
    clearCourseTable,
    updateCourses
}