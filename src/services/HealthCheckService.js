/**
 * This service provides access to the HealthCheck table
 */

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
    if (helper.featureFlagSet('TCA_DATASTORE', 'postgres')) {
        result = await dbHelper.dbHealthCheck()
    } else {
        result = await helper.getById('TopcoderAcademyHealthCheck', id)
    }

    return result
}

getHealthCheck.schema = {
    id: Joi.id()
}

module.exports = {
    getHealthCheck,
}
