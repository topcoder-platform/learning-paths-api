/**
 * This service provides operations on Topcoder Certification Resources
 */

const db = require('../db/models')
const DEFAULT_PAGE_LIMIT = 100

/**
 * Search Certification Resources
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function getResourcesForCertification(query = {}) {
    const dbQuery = {
        include: ['FreeCodeCampCertification', 'TopcoderUdemyCourse'],
        offset: query.offset || 0,
        limit: query.limit || DEFAULT_PAGE_LIMIT,
        order: [
            ['displayOrder', 'ASC'],
        ],
    };

    if (query.topcoderCertificationId) {
        dbQuery.where = {
            topcoderCertificationId: query.topcoderCertificationId,
        };
    }

    // check for order params
    if (query.order_by || query.order_type) {
        dbQuery.order = [[query.order_by || 'displayOrder', query.order_type || 'ASC']];
    }

    return db.CertificationResource.findAll(dbQuery);
}

/**
 * Get Certification by ID
 * 
 * @param {String} id the certification ID
 * @returns {Object} the certification with given ID
 */
async function getCertification(id) {
    const ret = await helper.getById('Certification', id)
    return ret
}

module.exports = {
    getResourcesForCertification
}
