const db = require('../db/models');
const helper = require('../common/helper');

async function dbHealthCheck() {
    const provider = await db.ResourceProvider.findOne()
    if (!provider) {
        throw "Postgres error: No ResourceProviders found";
    }
}

async function findAndCountAllPages(model, page, perPage, where = {}) {
    let params = {
        offset: (page - 1) * perPage,
        limit: perPage
    }

    if (where != {}) {
        params.where = where
    }

    const { count, rows } = await db[model].findAndCountAll(params)

    return { count, rows }
}

function featureFlagUsePostgres() {
    return helper.featureFlagSet('TCA_DATASTORE', 'postgres')
}

module.exports = {
    dbHealthCheck,
    findAndCountAllPages,
    featureFlagUsePostgres
}