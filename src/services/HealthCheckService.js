/**
 * This service provides access to the HealthCheck table
 */

const Joi = require('joi')
const helper = require('../common/helper')

/**
 * Get HealthCheck by ID.
 * 
 * @param {String} id the health check ID
 * @returns {Object} the health check with given ID
 */
async function getHealthCheck(id) {
    const result = await helper.getById('TopcoderAcademyHealthCheck', id)

    return result
}

getHealthCheck.schema = {
    id: Joi.id()
}

module.exports = {
    getHealthCheck,
}
