/**
 * This service provides operations on Topcoder Certifications
 */

const db = require('../db/models')
const DEFAULT_PAGE_LIMIT = 10

/**
 * Search Certifications
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCertifications(query = {}) {
    const dbQuery = {
        include: [
            {
                model: db.CertificationResource,
                as: 'certificationResources',
                include: [
                    {
                        model: db.FreeCodeCampCertification,
                        as: 'freeCodeCampCertification'
                    },
                    // TODO: leaving this here as an example of how we will 
                    // need to handle the polymorphic association between resources
                    // and the underlying course data. We are only currently 
                    // using FreeCodeCamp certifications.

                    // {
                    //     model: db.TopcoderUdemyCourse,
                    //     as: 'TopcoderUdemyCourse'
                    // }
                ],
            },
            {
                model: db.CertificationCategory,
                as: 'certificationCategory'
            },
            {
                model: db.ResourceProvider,
                as: 'resourceProviders',
            }],
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

    return await db.TopcoderCertification.findAndCountAll(dbQuery)
}

/**
 * Get Certification by ID
 * 
 * @param {String} id the certification ID
 * @returns {Object} the certification with given ID
 */
async function getCertification(id) {
    const options = {
        include: {
            model: db.CertificationResource,
            as: 'certificationResources',
            include: [
                {
                    model: db.FreeCodeCampCertification,
                    as: 'freeCodeCampCertification'
                },
            ]
        }
    }

    return db.TopcoderCertification.findByPk(id, options)
}

module.exports = {
    searchCertifications,
    getCertification
}
