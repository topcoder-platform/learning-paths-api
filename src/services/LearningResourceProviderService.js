/**
 * This service provides operations on Learning Path certifications.
 */

const _ = require('lodash')
const Joi = require('joi')
const { v4: uuidv4 } = require('uuid');
const helper = require('../common/helper')
const constants = require('../../app-constants')

/**
 * Search Learning Resource Providers
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchLearningResourceProviders(criteria) {

    records = await helper.scanAll('LearningResourceProvider')

    const page = criteria.page || 1
    const perPage = criteria.perPage || 50

    const total = records.length
    const result = records.slice((page - 1) * perPage, page * perPage)

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

 // logger.buildService(module.exports)
