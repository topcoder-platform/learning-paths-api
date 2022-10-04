/**
 * This service provides operations on Learning Path certifications.
 */

const _ = require('lodash')
const Joi = require('joi')
const helper = require('../common/helper')

const ACTIVE_STATES = ['active', 'coming-soon'];

/**
 * Search Certifications
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCertifications(criteria) {

    records = await helper.scanAll('Certification')

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
        // implement filtering by state
    } else {
        // Only return certifications that are in one of active states
        records = _.filter(
            records,
            e => ACTIVE_STATES.includes(e.state)
        )
    }

    const total = records.length
    const result = records.slice((page - 1) * perPage, page * perPage)

    return { total, page, perPage, result }
}

searchCertifications.schema = {
    criteria: Joi.object().keys({
        page: Joi.page(),
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
    const ret = await helper.getById('Certification', id)
    return ret
}

getCertification.schema = {
    id: Joi.id()
}

module.exports = {
    searchCertifications,
    getCertification,
}

 // logger.buildService(module.exports)
