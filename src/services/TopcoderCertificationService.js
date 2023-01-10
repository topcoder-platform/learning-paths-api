/**
 * This service provides operations on Topcoder Certifications
 */

const db = require('../db/models')
const ACTIVE_STATES = ['active', 'coming-soon'];
const DEFAULT_PAGE_LIMIT = 10

/**
 * Search Certifications
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function getCertifications(query = {}) {

    const dbQuery = {
        include:
        {
            model: db.CertificationResource,
            as: 'certificationResources',
            include: [
                {
                    model: db.FreeCodeCampCertification,
                    as: 'FreeCodeCampCertification'
                },

                // TODO: leaving this here as an example of how we will 
                // need to handle the polymorphic association between resources
                // and the underlying course data. We are only currently 
                // using FreeCodeCamp certifications.

                // {
                //     model: db.TopcoderUdemyCourse,
                //     as: 'TopcoderUdemyCourse'
                // }
            ]
        },
        offset: query.offset || 0,
        limit: query.limit || DEFAULT_PAGE_LIMIT,
        order: [
            ['title', 'ASC'],
        ],
    };
    // check for order params
    if (query.order_by || query.order_type) {
        dbQuery.order = [[query.order_by || 'title', query.order_type || 'ASC']]
    }

    return db.TopcoderCertification.findAndCountAll(dbQuery)
}

/**
 * Get Certification by ID
 * 
 * @param {String} id the certification ID
 * @returns {Object} the certification with given ID
 */
async function getCertification(id) {
    return db.TopcoderCertification.findByPk(id)
}

module.exports = {
    getCertifications,
    getCertification
}
