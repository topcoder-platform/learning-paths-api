/**
 * This service retrieves completed Topcoder Academy certifications
 */

const db = require('../db/models');
const { progressStatuses } = require('../common/constants');

/**
 * Get all completed certifications for a user
 * 
 * @param {String} userId the user's numerical Topcoder ID
 * @returns {Object} the certifications they have completed
 */
async function getCompletedCertifications(userId) {
    let options = {
        where: {
            userId,
            status: progressStatuses.completed,
        },
        include: [
            {
                model: db.ResourceProvider,
                as: 'resourceProvider',
                attributes: ['id', 'name', 'description', 'attributionStatement', 'url'],
                through: { attributes: [] }
            }
        ]
    }

    try {
        let progresses = await db.FccCertificationProgress.findAll(options);

        return progresses;
    } catch (error) {
        console.error(error);
        return [];
    }
}

module.exports = {
    getCompletedCertifications
}
