/**
 * This service provides operations on Learning Path resource providers.
 */

const _ = require('lodash')
const Joi = require('joi')
const dbHelper = require('../common/dbHelper')
const helper = require('../common/helper')

/**
 * Search Learning Resource Providers
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchLearningResourceProviders(criteria) {
    const page = criteria.page || 1
    const perPage = criteria.perPage || 50

    let records = [];
    let total, result;

    if (dbHelper.featureFlagUsePostgres()) {
        // add any query params to the where clause
        let options = {};

        if (criteria.name) {
            options.where = { name: criteria.name }
        }

        ({ count: total, rows: result } = await dbHelper.findAndCountAllPages('ResourceProvider', page, perPage, options));
    } else {
        records = await helper.scanAll('LearningResourceProvider')
        total = records.length
        result = records.slice((page - 1) * perPage, page * perPage)
    }

    return { total, page, perPage, result }
}

searchLearningResourceProviders.schema = {
    criteria: Joi.object().keys({
        page: Joi.page(),
        perPage: Joi.number().integer().min(1).max(100).default(100),
        name: Joi.string(),
    })
}

/**
 * Get Learning Resource Provider by ID.
 * @param {String} id the provider ID
 * @returns {Object} the provider with given ID
 */
async function getLearningResourceProvider(id) {
    const ret = await helper.getById('LearningResourceProvider', id)
    return ret
}

getLearningResourceProvider.schema = {
    id: Joi.id()
}

module.exports = {
    searchLearningResourceProviders,
    getLearningResourceProvider,
}
