/**
 * This service provides access to the HealthCheck table
 */

const db = require('../db/models');

/**
 * Get HealthCheck by ID.
 * 
 * @param {String} id the health check ID
 * @returns {Object} the health check with given ID
 */
async function getHealthCheck(id) {
    const result = await healthCheck();

    return result
}

async function healthCheck() {
    const provider = await db.ResourceProvider.findOne()
    if (!provider) {
        throw "Postgres error: No ResourceProviders found";
    }

    return provider;
}

module.exports = {
    getHealthCheck,
}
