/**
 * This service provides operations on Learning Path certifications.
 */

const _ = require('lodash')
const Joi = require('joi')
const { Op } = require("sequelize");

const db = require('../db/models');
const helper = require('../common/helper')

const ACTIVE_STATES = ['active', 'coming-soon'];

/**
 * Search Certifications
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCertifications(criteria) {
    let page = criteria.page || 1;
    let perPage = criteria.perPage || 50;
    let total, result;

    ({ total, result } = await searchPGCertifications(criteria))

    return { total, page, perPage, result }
}

async function searchPGCertifications(criteria) {
    let page = criteria.page || 1
    let perPage = criteria.perPage || 50

    let options = {};
    let query = {};
    if (criteria.state) {
        query.state = criteria.state
    } else {
        query.state = {
            [Op.or]: ACTIVE_STATES
        }
    }
    options.where = query;

    options.include = [
        {
            model: db.CertificationCategory,
            as: 'certificationCategory'
        },
        {
            model: db.FccCourse,
            as: 'course'
        },
        {
            model: db.ResourceProvider,
            as: 'resourceProvider'
        },
    ];

    options.attributes = {
        include: [
            [
                // Note the wrapping parentheses in the call below!
                db.sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM "FccModules" AS module
                    WHERE
                        module."fccCourseId" = "course".id
                )`),
                'moduleCount'
            ]
        ]
    };

    ({ count: total, rows: result } = await dbHelper.findAndCountAllPages('FreeCodeCampCertification', page, perPage, options));

    return { total, result }
}

/**
 * Get Certification by ID
 * 
 * @param {String} id the certification ID
 * @returns {Object} the certification with given ID
 */
async function getCertification(id) {
    const includeAssociations = {
        model: db.CertificationCategory,
        as: 'certificationCategory'
    };

    // TODO: This is a workaround for API calls from the front-end that are still
    // using the FCC UUID values for IDs. Remove this once that is fixed.
    let where;
    if (Number.isInteger(parseInt(+id))) {
        where = { id: id }
    } else {
        // assume it's a UUID -- if not, too bad, it will throw
        where = { fccId: id }
    }

    const certification = await db.FreeCodeCampCertification.findOne({
        where: where,
        include: includeAssociations
    })

    return certification
}

module.exports = {
    searchCertifications,
    getCertification,
}

