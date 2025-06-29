
const { PrismaClient, CourseStatus } = require('@prisma/client');

const prisma = new PrismaClient()

/**
 * Updates the list of Udemy courses available in Topcoder 
 * Academy by marking removed courses.
 * 
 * @returns the result of the course update operation
 */
async function reconcileCourses() {
    return await markCoursesAsRemoved();
}

/**
 * Checks the list of Udemy courses available in Topcoder Academy 
 * against the current full Udemy course list to detect and mark 
 * as removed any courses that have been removed from the Udemy 
 * course list.
 * 
 * @returns the result of the removal operation
 */
async function markCoursesAsRemoved() {
    const removedIds = await getCourseIdsToRemove();
    return await setStatusToRemoved(removedIds);
}

/**
 * Generates a list of course IDs for courses that are currently 
 * available in the Topcoder Academy Udemy course list but that 
 * have been removed from the Udemy course listing.
 * 
 * @returns an array of course IDs that should be removed 
 */
async function getCourseIdsToRemove() {
    // Execute a LEFT OUTER JOIN query to detect Udemy courses
    // that have been removed that we reference in the Topcoder 
    // courses list.
    const coursesRemoved = await prisma.$queryRaw`
        SELECT tc.id as course_id
        FROM ${process.env.TCA_PG_SCHEMA}."TopcoderUdemyCourse" tc
        left outer join "UdemyCourse" uc on uc.id = tc.id
        where tc.status = 'available'
            and uc.id is null
        ORDER BY tc.id ASC 
    `

    return coursesRemoved.map(course => course.course_id);
}

/**
 * Sets the TopcoderUdemyCourse status and removedAt columns for 
 * courses that have been removed from the Udemy course listing.
 * 
 * @param {Array} removedIds an array of course IDs
 * @returns the result of the status update DB operation
 */
async function setStatusToRemoved(removedIds) {
    if (!removedIds || removedIds.length == 0) return {};

    const coursesRemoved = await prisma.topcoderUdemyCourse.updateMany({
        where: {
            id: {
                in: removedIds
            },
        },
        data: {
            status: CourseStatus.removed,
            removedAt: new Date()
        },
    })

    return coursesRemoved
}

module.exports = {
    reconcileCourses
}