/**
 * This service retrieves completed Topcoder Academy certifications
 */

const helper = require('../common/helper')

/**
 * Get all completed certifications for a user
 * 
 * @param {String} userId the user's numerical Topcoder ID
 * @returns {Object} the certifications they have completed
 */
async function getCompletedCertifications(userId) {
    const certifications = await helper.queryCompletedCertifications(userId);

    return certifications
}

module.exports = {
    getCompletedCertifications
}
