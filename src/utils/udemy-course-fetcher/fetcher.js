const axios = require('axios');
const fs = require('fs');
const path = require('path');

const s3Store = require('./course_s3_store');
const courseDbWriter = require('./course_db_writer');

const ACCOUNT_NAME = process.env.UDEMY_ACCOUNT_NAME;
const ACCOUNT_ID = process.env.UDEMY_ACCOUNT_ID;
const CLIENT_ID = process.env.UDEMY_CLIENT_ID;
const CLIENT_SECRET = process.env.UDEMY_CLIENT_SECRET;

const PAGE_SIZE = 100;
const API_CALL_DELAY = 4; // seconds between calls to Udemy API
const COURSE_LOCALES = ['en_US']

const BASE_URL = `https://${ACCOUNT_NAME}.udemy.com/api-2.0/organizations/${ACCOUNT_ID}/courses/list/`
const URL_WITH_PAGE_SIZE = `${BASE_URL}?page_size=${PAGE_SIZE}`
const UDEMY_API_TIMEOUT = process.env.UDEMY_API_TIMEOUT || 20000; // milliseconds

const COURSE_FILES_DIR = "course-files"
const COURSES_FILE = 'udemy-courses';

const courseCategories = require('./categories.json');

axios.defaults.headers.common['Authorization'] = `Basic ${base64ClientCredentials()}`

module.exports.handleCourses = async (event) => {
    console.log("function triggered by event", JSON.stringify(event, null, 2));
    const pageLimit = event.detail?.pageLimit;

    try {
        const courseData = await fetchAllCourses(pageLimit);
        const courses = await processCourseResults(courseData);

        if (courses.length > 0) {
            await writeCourseFile(courses);
            return await courseDbWriter.updateCourses(courses);
        } else {
            console.error("** no courses were retrieved -- exiting!")
            return false;
        }

    } catch (error) {
        console.error(error);
    }
}

/**
 * Retrieves all of the results from the Udemy Business Courses API, 
 * up to the +pageLimit+ number of pages of results, if given, otherwise
 * all of the available pages of results are retrieved.
 * 
 * @param {Integer} pageLimit (optional) the maximum number of pages to retrieve
 * @returns an array of resolved course retrieval Promises
 */
async function fetchAllCourses(pageLimit = null) {
    if (pageLimit) {
        console.log(`retrieving ${pageLimit} pages of Udemy course results`)
    }

    const numPages = pageLimit ? pageLimit : await fetchNumPages();
    const pages = mapPages(numPages);

    return await fetchCourses(pages);
}

/**
 * Fetches Udemy Business courses from the UB API
 * 
 * @param {pages} pages an array of page numbers to retrieve
 * @returns an array of UdemyCourse objects
 */
async function fetchCourses(pages) {
    const totalPages = pages.length;

    const result = await Promise.allSettled(
        pages.map(async (page, pageIndex) => {
            const courses = await getUdemyCourses(page, pageIndex, totalPages);
            return courses;
        })
    );

    return result;
}

/**
 * Computes the number of pages of results that have to be retrieved
 * to get all of the available courses by getting the first course 
 * from the API and parsing the +count+ of courses attribute, then 
 * divides that by the number of items per page of results and rounds up.
 * 
 * @returns integer count of total pages of courses available
 */
async function fetchNumPages() {
    const url = `${BASE_URL}?page=1`
    const result = await axios.get(url, { timeout: UDEMY_API_TIMEOUT });
    const courseCount = result.data.count;

    const numPages = Math.ceil(courseCount / PAGE_SIZE);
    console.log("** total number of pages to fetch:", numPages);

    return numPages
}

/**
 * Gets a page of course listings from the Udemy Business Courses API
 * 
 * @param {Integer} page the page number to retrieve
 * @param {Integer} pageIndex the page number for delay computation
 * @param {Integer} totalPages the total number of results pages to retrieve
 * @returns an array of course listing results 
 */
async function getUdemyCourses(page, pageIndex, totalPages) {
    const url = `${URL_WITH_PAGE_SIZE}&page=${page}`

    // adding a delay here to deal with UB API throttling of 
    // requests, which as of Nov 2022 is about 20 req/min
    await delay(API_CALL_DELAY * pageIndex)

    logPage(page, pageIndex, totalPages);
    const result = await axios.get(url, { timeout: UDEMY_API_TIMEOUT });

    return result.data.results;
}

/**
 * Logs the page of API results that's being requested. For a request for 
 * a large number of pages it logs every 10th page request, along with the 
 * first and last pages, so we can see latency in the logs. 
 * 
 * @param {Integer} page the current numbered page
 * @param {Integer} pageIndex the index of the page in the array of pages
 * @param {Integer} totalPages the total number of pages being requested
 */
function logPage(page, pageIndex, totalPages) {
    if (totalPages <= 20) {
        if (page == (pageIndex + 1)) {
            console.log(`* getting page # ${page} of ${totalPages}`);
        } else {
            console.log(`* getting page # ${page}, ${pageIndex + 1} of ${totalPages}`);
        }
    } else {
        // show a periodic page update 
        if (pageIndex == 0 || (pageIndex + 1) % 10 == 0 || (pageIndex == totalPages - 1)) {
            console.log(`* getting page # ${page}, ${pageIndex + 1} of ${totalPages}`);
        }
    }
}

/**
 * A utility function to delay execution since JS doesn't understand +sleep+
 * like all the other languages
 * 
 * @param {integer} secsToDelay number of seconds to pause
 * @returns simply delays execution until this completes, so returns...wasted time?
 */
function delay(secsToDelay) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, secsToDelay * 1000);
    })
}

/**
 * Processes API results and returns an array of JSON objects that represent 
 * Udemy Business courses
 * 
 * @param {Array} results a collection of resolved Promises that tried to retrieve 
 * API results
 */
async function processCourseResults(results) {
    let courseCount = 0;
    let courses = [];
    let unfulfilledPageRequests = [];
    let page = 0;

    for (const result of results) {
        page += 1;
        if (result?.status == 'fulfilled') {
            // filter out courses we don't care about
            const courseResults = result.value.filter(filterCourse)

            for (const course of courseResults) {
                courseCount += 1;
                courses.push(course);
            }
        } else {
            // if a promise wasn't fulfilled then something went wrong and 
            // we didn't get all of the courses, so record which page we 
            // requested and log it
            console.log("** unfulfilled promise, page", page, result.status)
            console.log("-- reason:", result.reason.message);
            unfulfilledPageRequests.push(page)
        }
    }

    console.log('total courses initially retrieved:', courseCount);

    // if any page requests were unfulfilled, make one more attempt 
    // to retrieve them
    if (unfulfilledPageRequests.length > 0) {
        courses = await retryUnfulfilledPageRequests(courses, unfulfilledPageRequests);
    }

    return courses;
}

/**
 * Filters courses by select locales, categories and subscategories. 
 * Used to exclude courses we don't want to show in TCA.
 * 
 * @param {Object} course a raw Udemy course object
 * @returns true if this course should be included in the results
 */
function filterCourse(course) {
    if (!COURSE_LOCALES.includes(course.locale?.locale)) return false;

    const category = course.primary_category?.title;
    const subcategory = course.primary_subcategory?.title;

    if (!(category && subcategory)) return false;

    if (!courseCategories[category]) return false;

    return courseCategories[category].subcategories.includes(subcategory)
}

/**
 * Retries API requests to retrieve pages of course results 
 * 
 * @param {Array} courses the collection of courses that have been retrieved
 * @param {Array} pages list of pages of results that were not successfully retrieved
 * @returns an array of courses updated with the additional courses that were retrieved
 */
async function retryUnfulfilledPageRequests(courses, pages) {
    console.log(`** retrying unfulfilled requests for ${pages.length} pages`)

    const results = await fetchCourses(pages);
    let courseCount = 0;
    let page = 0;

    for (const result of results) {
        page += 1;
        if (result?.status == 'fulfilled') {
            for (const course of result.value) {
                courseCount += 1;
                courses.push(course);
            }
        } else {
            // if a promise wasn't fulfilled then something went wrong and 
            // we didn't get all of the courses, so bail out
            console.log("** unfulfilled promise, page", page, result.status)
            console.log("-- reason:", result.reason.message);
        }
    }

    console.log("retried and retrieved courses:", courseCount)
    return courses;
}

/**
 * Writes the Udemy course data to a JSON file, locally and/or to AWS S3.
 * We only want the file written to S3 when the function is executing in AWS
 * so we use a simple check of an env var. We also allow 'forcing' the S3 
 * upload for local testing by setting an env var.
 * 
 * @param {Array} courses array of Udemy course objects
 * of where the function is executing (allows local testing)
 */
async function writeCourseFile(courses) {
    const forceS3 = process.env.FORCE_S3 ? true : false
    if (runningInAWS() || forceS3) {
        writeCourseFileToS3(courses);
    }

    if (!runningInAWS()) {
        writeLocalCourseFile(courses);
    }
}

/**
 * Simple check to see if the function is running in AWS
 * 
 * @returns true if the function is running in AWS
 */
function runningInAWS() {
    return process.env.AWS_EXECUTION_ENV ? true : false
}

/**
 * Writes the retrieved course objects to a file
 * 
 * @param {Object} courses the course objects that were retrieved from the API
 */
function writeLocalCourseFile(courses) {
    const coursesPath = courseFilePath();
    console.log("** writing course data to:", coursesPath);

    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
    return coursesPath;
}

async function writeCourseFileToS3(courses) {
    const uploadedFilename = await s3Store.writeToS3(courses);
    return uploadedFilename;
}

/**
 * Generates a file path for writing the Udemy course file to disk 
 * 
 * @returns the file path 
 */
function courseFilePath() {
    return path.join(__dirname, COURSE_FILES_DIR, courseFileName());
}

/**
 * Generates a file name for the Udemy course JSON file. Replaces 
 * dots and colons in timestamp with dashes.
 * 
 * @returns string file name
 */
function courseFileName() {
    let ts = new Date(Date.now()).toISOString().replace(/[\.:]/g, '-');

    return `${COURSES_FILE}-${ts}.json`
}

/**
 * Generates an array of page numbers to feed to the Udemy API 
 * in order to request all of the pages of course results 
 * 
 * @param {Integer} lastPage the last page of results
 * @returns an array of page numbers, from 1 to lastPage
 */
function mapPages(lastPage) {
    return Array.from({ length: lastPage }, (_, i) => i + 1)
}

/**
 * Generates a Base64-encoded string of ClientID:ClientSecret, for use in 
 * Basic authentication to the Udemy API
 * 
 * @returns base64-encoded string 
 */
function base64ClientCredentials() {
    const clientCredentials = `${CLIENT_ID}:${CLIENT_SECRET} `;
    const buf = Buffer.from(clientCredentials);
    const authString = buf.toString('base64');

    return authString;
}