/**
 * This service provides operations of challenge tracks.
 */

const _ = require('lodash')
const Joi = require('joi')
const { v4: uuidv4 } = require('uuid');
const helper = require('../common/helper')
const constants = require('../../app-constants')

/**
 * Search challenge types
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchChallengeTypes(criteria) {

  records = await helper.scanAll('Certification')

  const page = criteria.page || 1
  const perPage = criteria.perPage || 50

  const total = records.length
  const result = records.slice((page - 1) * perPage, page * perPage)

  return { total, page, perPage, result }
}

searchChallengeTypes.schema = {
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.number().integer().min(1).max(100).default(100),
    name: Joi.string(),
    description: Joi.string(),
    isActive: Joi.boolean(),
    isTask: Joi.boolean().default(false),
    abbreviation: Joi.string()
  })
}

/**
 * Get challenge type.
 * @param {String} id the challenge type id
 * @returns {Object} the challenge type with given id
 */
async function getChallengeType(id) {
  const ret = await helper.getById('LearningResourceProvider', id)
  return ret
}

getChallengeType.schema = {
  id: Joi.id()
}

module.exports = {
  searchChallengeTypes,
  getChallengeType,
}

// logger.buildService(module.exports)
