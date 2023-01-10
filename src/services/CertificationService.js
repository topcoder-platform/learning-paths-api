/**
 * This service provides operations on Learning Path certifications.
 */

const _ = require('lodash')
const Joi = require('joi')
const { Op } = require("sequelize");

const db = require('../db/models');
const dbHelper = require('../common/dbHelper')
const helper = require('../common/helper')

const ACTIVE_STATES = ['active', 'coming-soon'];

/**
 * Search Certifications
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCertifications(criteria) {
    let page = criteria.page || 1
    let perPage = criteria.perPage || 50
    let total, result;

    if (dbHelper.featureFlagUsePostgres()) {
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

        options.include = [{
            model: db.CertificationCategory,
            as: 'certificationCategory'
        }];

        ({ count: total, rows: result } = await dbHelper.findAndCountAllPages('FreeCodeCampCertification', page, perPage, options));
    } else {
        ({ total, result } = await searchDynamoCertifications(criteria))
    }

    return { total, page, perPage, result }
}

async function searchDynamoCertifications(criteria) {
    let records = await helper.scanAll('Certification')

    const page = criteria.page || 1
    const perPage = criteria.perPage || 50

    // filter data by given criteria
    if (criteria.providerName) {
        records = _.filter(
            records,
            e => helper.fullyMatch(criteria.providerName, e.providerName)
        )
    }

    if (criteria.state) {
        // TODO: implement filtering by state
    } else {
        // Only return certifications that are in one of active states
        records = _.filter(
            records,
            e => ACTIVE_STATES.includes(e.state)
        )
    }

    const total = records.length
    const result = records.slice((page - 1) * perPage, page * perPage)

    return { total, result }
}

searchCertifications.schema = {
    criteria: Joi.object().keys({
        page: Joi.number(),
        perPage: Joi.number().integer().min(1).max(100).default(100),
        provider: Joi.string(),
    })
}

/**
 * Get Certification by ID
 * 
 * @param {String} id the certification ID
 * @returns {Object} the certification with given ID
 */
async function getCertification(id) {
    let certification;

    if (dbHelper.featureFlagUsePostgres()) {
        const where = { fccId: id }
        const includeAssociations = [{
            model: db.CertificationCategory,
            as: 'certificationCategory'
        }];

        certification = await dbHelper.findOne('FreeCodeCampCertification', where, includeAssociations)
    } else {
        certification = await helper.getById('Certification', id)
    }
    return certification
}

getCertification.schema = {
    id: Joi.string()
}

module.exports = {
    searchCertifications,
    getCertification,
}

 // logger.buildService(module.exports)
