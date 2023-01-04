/**
 * This service provides access to the HealthCheck table
 */
const config = require('config')
const Joi = require('joi')

const dbHelper = require('../common/dbHelper')
const helper = require('../common/helper')

/**
 * Get HealthCheck by ID.
 * 
 * @param {String} id the health check ID
 * @returns {Object} the health check with given ID
 */
async function getHealthCheck(id) {
    let result;
    if (dbHelper.featureFlagUsePostgres()) {
        result = await dbHelper.dbHealthCheck()
    } else {
        const healthCheckId = config.HEALTH_CHECK_ID || 'health-check'
        result = await helper.getById('TopcoderAcademyHealthCheck', healthCheckId)
    }

    return result
}

getHealthCheck.schema = {
    id: Joi.id()
}

module.exports = {
    getHealthCheck,
}
