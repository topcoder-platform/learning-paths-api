/**
 * This service retrieves completed Topcoder Academy certifications
 */

const db = require('../db/models');
const dbHelper = require('../common/dbHelper')
const helper = require('../common/helper')
const { progressStatuses } = require('../common/constants');
const enrollmentService = require('./CertificationEnrollmentService');

/**
 * Get all completed certifications for a user
 * 
 * @param {String} userId the user's numerical Topcoder ID
 * @returns {Object} the certifications they have completed
 */
async function getCompletedCertifications(userId) {
    if (!dbHelper.featureFlagUsePostgres()) {
        return await helper.queryCompletedCertifications(userId);
    }

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

/**
 * Fetches completed TCA enrollments/certs filtered by `userId`
 * @param {string} userId 
 */
async function getCompletedTCAEnrollments(userId) {
    return enrollmentService.getEnrollments({
        where: {
            status: 'completed',
            userId
        },
        include: [{
            model: db.TopcoderCertification,
            as: 'topcoderCertification',
            include: {
                model: db.CertificationCategory,
                as: 'certificationCategory',
            }
        }]
    })
}

module.exports = {
    getCompletedCertifications,
    getCompletedTCAEnrollments
}
