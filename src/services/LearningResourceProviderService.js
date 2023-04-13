/**
 * This service provides operations on Learning Path resource providers.
 */

const db = require('../db/models');
const dbHelper = require('../common/dbHelper')

/**
 * Search Learning Resource Providers
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchLearningResourceProviders(criteria) {
    const page = criteria.page || 1
    const perPage = criteria.perPage || 50

    let total, result;

    // add any query params to the where clause
    let options = {};

    if (criteria.name) {
        options.where = { name: criteria.name }
    }

    const model = db['ResourceProvider'];
    ({ count: total, rows: result } = await dbHelper.findAndCountAllPages(model, page, perPage, options));

    return { total, page, perPage, result }
}

module.exports = {
    searchLearningResourceProviders,
}
