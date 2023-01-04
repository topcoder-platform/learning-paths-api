const db = require('../db/models');
const helper = require('../common/helper');
const { query } = require('express');

async function dbHealthCheck() {
    const provider = await db.ResourceProvider.findOne()
    if (!provider) {
        throw "Postgres error: No ResourceProviders found";
    }
}

async function findAndCountAllPages(model, page, perPage, where = null, include = null) {
    let params = {
        offset: (page - 1) * perPage,
        limit: perPage
    }

    // add where clause if provided
    if (where) {
        params.where = where
    }

    // add include clause if provided
    if (include) {
        params.include = include
    }

    const { count, rows } = await db[model].findAndCountAll(params)

    return { count, rows }
}

async function findOne(model, where, includeAssociations = null) {
    let query = { where: where }
    if (includeAssociations) {
        query.include = includeAssociations
    }
    return db[model].findOne(query);
}

function featureFlagUsePostgres() {
    return helper.featureFlagSet('TCA_DATASTORE', 'postgres')
}

module.exports = {
    dbHealthCheck,
    findAndCountAllPages,
    findOne,
    featureFlagUsePostgres
}