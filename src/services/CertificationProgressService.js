/**
 * This service provides operations on Learning Path certification progress.
 */

const _ = require('lodash')
const Joi = require('joi')
const helper = require('../common/helper')

/**
 * Search Certification Progress
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCertificationProgresses(criteria) {

    records = await helper.scanAll('CertificationProgress')

    const page = criteria.page || 1
    const perPage = criteria.perPage || 50

    // filter data by given criteria
    if (criteria.userCertificationId) {
        records = _.filter(
            records,
            e => helper.partialMatch(criteria.userCertificationId, e.userCertificationId))
    }

    const total = records.length
    const result = records.slice((page - 1) * perPage, page * perPage)

    return { total, page, perPage, result }
}

searchCertificationProgresses.schema = {
    criteria: Joi.object().keys({
        page: Joi.page(),
        perPage: Joi.number().integer().min(1).max(100).default(100),
        provider: Joi.string(),
    })
}

/**
 * Get CertificationProgress by ID
 * 
 * @param {String} userId the user ID
 * @param {String} certification the certification key
 * @returns {Object} the certification progress for the given user and certification
 */
async function getCertificationProgress(userId, certification) {
    const tableKeys = { userId: userId, certification: certification }
    const ret = await helper.getByTableKeys('CertificationProgress', tableKeys)
    return ret
}

getCertificationProgress.schema = {
    userId: Joi.string(),
    certification: Joi.string()
}

module.exports = {
    searchCertificationProgresses,
    getCertificationProgress,
}
