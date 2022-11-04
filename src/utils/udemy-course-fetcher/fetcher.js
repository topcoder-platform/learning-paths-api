const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ACCOUNT_NAME = process.env.UDEMY_ACCOUNT_NAME;
const ACCOUNT_ID = process.env.UDEMY_ACCOUNT_ID;
const CLIENT_ID = process.env.UDEMY_CLIENT_ID;
const CLIENT_SECRET = process.env.UDEMY_CLIENT_SECRET;

const PAGE_SIZE = 100;
const API_CALL_DELAY = 4; // seconds between calls to Udemy API

const BASE_URL = `https://${ACCOUNT_NAME}.udemy.com/api-2.0/organizations/${ACCOUNT_ID}/courses/list/`
const URL_WITH_PAGE_SIZE = `${BASE_URL}?page_size=${PAGE_SIZE}`

const COURSE_FILES_DIR = "course-files"
const COURSES_FILE = 'udemy-courses';

axios.defaults.headers.common['Authorization'] = `Basic ${base64ClientCredentials()}`

module.exports.handleCourses = async (pageLimit = null) => {
    try {
        const startTime = performance.now();

        const results = await fetchAllCourses(pageLimit);
        console.log('time:', `${(performance.now() - startTime).toFixed(1)}`);

        await processCourseResults(results);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Retrieves all of the results from the Udemy Business Courses API
 * 
 * @param {Integer} lastPage the last page of results to get
 * @returns an array of arrays of course results
 */
async function fetchAllCourses(pageLimit) {
    const numPages = pageLimit ? pageLimit : await fetchNumPages();
    const pages = mapPages(numPages);

    return await fetchCourses(pages);
}

async function fetchCourses(pages) {
    const result = await Promise.allSettled(
        pages.map(async (page, pageIndex) => {
            const courses = await getUdemyCourses(page, pageIndex);
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
    const result = await axios.get(url);
    const courseCount = result.data.count;

    const numPages = Math.ceil(courseCount / PAGE_SIZE);
    console.log("** total number of pages to fetch:", numPages);

    return numPages
}

/**
 * Gets a page of course listings from the Udemy Business Courses API
 * 
 * @param {Integer} page the page number to retrieve
 * @param {Integer} pageIndex (optional) the page number for delay computation
 * @returns an array of course listing results 
 */
async function getUdemyCourses(page = 1, pageIndex = null) {
    const url = `${URL_WITH_PAGE_SIZE}&page=${page}`

    await delay(API_CALL_DELAY * (pageIndex ? pageIndex : page))

    console.log("* getting page", page);

    const result = await axios.get(url);

    return result.data.results;
}

function delay(secsToDelay) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, secsToDelay * 1000);
    })
}

async function processCourseResults(results) {
    let courseCount = 0;
    let courses = [];
    let unfulfilledPageRequests = [];
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
            unfulfilledPageRequests.push(page)
        }
    }

    console.log('total courses initially retrieved:', courseCount);

    // if any page requests were unfulfilled, make one more attempt 
    // to retrieve them
    if (unfulfilledPageRequests.length > 0) {
        courses = await retryUnfulfilledPageRequests(courses, unfulfilledPageRequests);
    }

    writeCoursesFile(courses);
}

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

function writeCoursesFile(courses) {
    const coursesPath = courseFilePath();
    console.log("** writing course data to:", coursesPath);

    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
}

function collectCategoryInfo(categories, course) {
    categories = categories.concat(course.categories);

    const topicList = course.topics.map(topic => topic.title);
    topics = topics.concat(topicList);

    const primaryCategory = course.primary_category?.title;
    const subCategory = course.primary_subcategory?.title;

    if (primaryCategory && subCategory) {
        if (Object.keys(primaryCategories).includes(primaryCategory)) {
            primaryCategories[primaryCategory].add(subCategory)
        } else {
            const subCategories = new Set();
            subCategories.add(subCategory);
            primaryCategories[primaryCategory] = subCategories;
        }
    } else {
        console.log("-- no category info for course", course.id)
    }

    // const uniqueCategories = [...new Set(categories)]
    // console.log('categories', uniqueCategories.sort());

    // console.log('primary categories', primaryCategories)

    // const uniqueTopics = [...new Set(topics)]
    // console.log('unique topics', uniqueTopics.length);
    // console.log('topics', uniqueTopics.sort())
}

function courseFilePath() {
    const ts = new Date(Date.now()).toISOString();
    const filename = `${COURSES_FILE}-${ts}.json`
    return path.join(__dirname, COURSE_FILES_DIR, filename);
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
    const clientCredentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
    const buf = Buffer.from(clientCredentials);
    const authString = buf.toString('base64');

    return authString;
}