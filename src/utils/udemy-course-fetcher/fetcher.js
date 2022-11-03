const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ACCOUNT_NAME = process.env.UDEMY_ACCOUNT_NAME;
const ACCOUNT_ID = process.env.UDEMY_ACCOUNT_ID;
const CLIENT_ID = process.env.UDEMY_CLIENT_ID;
const CLIENT_SECRET = process.env.UDEMY_CLIENT_SECRET;

const PAGE_SIZE = 100;

const BASE_URL = `https://${ACCOUNT_NAME}.udemy.com/api-2.0/organizations/${ACCOUNT_ID}/courses/list/`
const URL_WITH_PAGE_SIZE = `${BASE_URL}?page_size=${PAGE_SIZE}`

const COURSE_FILES_DIR = "course-files"
const COURSES_FILE = 'udemy-courses.json';

axios.defaults.headers.common['Authorization'] = `Basic ${base64ClientCredentials()}`

module.exports.handleCourses = async (pageLimit = null) => {
    try {
        const startTime = performance.now();

        const results = await fetchCourses(pageLimit);
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
async function fetchCourses(pageLimit) {
    const numPages = pageLimit ? pageLimit : await fetchNumPages();
    const pages = mapPages(numPages);

    const result = await Promise.allSettled(
        pages.map(async (page) => {
            const courses = await getUdemyCourses(page);
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

    return numPages
}

/**
 * Gets a page of course listings from the Udemy Business Courses API
 * 
 * @param {Integer} page the page number to retrieve
 * @returns an array of course listing results 
 */
async function getUdemyCourses(page = 1) {
    const url = `${URL_WITH_PAGE_SIZE}&page=${page}`
    const result = await axios.get(url);

    return result.data.results;
}

async function processCourseResults(results) {
    let courseCount = 0;
    let courses = [];

    let topics = [];
    let categories = [];
    let primaryCategories = {};

    for (const result of results) {
        if (result?.status == 'fulfilled') {
            for (const course of result.value) {
                courseCount += 1;
                courses.push(course);

                categories = categories.concat(course.categories);

                const primaryCategory = course.primary_category.title;
                const subCategory = course.primary_subcategory.title;

                const topicList = course.topics.map(topic => topic.title);
                topics = topics.concat(topicList);

                if (Object.keys(primaryCategories).includes(primaryCategory)) {
                    primaryCategories[primaryCategory].add(subCategory)
                } else {
                    const subCategories = new Set();
                    subCategories.add(subCategory);
                    primaryCategories[primaryCategory] = subCategories;
                }
            }
        } else {
            // if a promise wasn't fulfilled then something went wrong and 
            // we didn't get all of the courses, so bail out
            console.log("status", result.status);
            console.log("reason", result.reason.message);

            break
        }
    }

    console.log('total courses retrieved:', courseCount);

    // const uniqueCategories = [...new Set(categories)]
    // console.log('categories', uniqueCategories.sort());

    // console.log('primary categories', primaryCategories)

    // const uniqueTopics = [...new Set(topics)]
    // console.log('unique topics', uniqueTopics.length);
    // console.log('topics', uniqueTopics.sort())
}

function writeCoursesFile(courses) {
    const coursesPath = path.join(__dirname, COURSE_FILES_DIR, COURSES_FILE);
    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
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