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
 *   4. Delete the course data for the previous (older) version
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

function formatRawCourseDataForInput(rawCourseData, dataVersion) {
    let inputData = [];

    for (let data of rawCourseData) {
        const record = recordFromRawData(data, dataVersion)
        inputData.push(record)
    }

    return inputData;
}

async function writeCoursesToTable(courseData) {
    const writeCourses = await prisma.udemyCourse.createMany({ data: courseData })
    // console.log("writeCourses", writeCourses);

    return writeCourses
}

async function removePreviousCourseVersions(currentVersion) {
    const deleteCourses = await prisma.udemyCourse.deleteMany({
        where: {
            data_version: {
                lt: currentVersion
            }
        }
    })

    // console.log("removePreviousCourseVersions", deleteCourses);
    return deleteCourses;
}

async function clearCourseTable() {
    const deleteCourses = await prisma.udemyCourse.deleteMany({})

    console.log("clearCourses result", deleteCourses);
    return deleteCourses;
}

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

function setLearnerLevel(level) {
    if (level === null ||
        level == '' ||
        level == 'All Levels') return 'All_Levels';

    return level;
}

module.exports = {
    updateCourses
}