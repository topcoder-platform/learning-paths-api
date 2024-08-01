const db = require('../db/models');

async function findAndCountAllPages(model, page, perPage, options = {}) {
    let params = {
        offset: (page - 1) * perPage,
        limit: perPage
    }

    // add where clause if provided
    if (options.where) {
        params.where = options.where
    }

    // add include clause if provided
    if (options.include) {
        params.include = options.include
    }

    // add attributes clause if provided
    if (options.attributes) {
        params.attributes = options.attributes
    }

    const { count, rows } = await model.findAndCountAll(params)

    return { count, rows }
}

async function findOne(model, where, includeAssociations = null) {
    let query = { where: where }
    if (includeAssociations) {
        query.include = includeAssociations
    }
    return db[model].findOne(query);
}

async function findAll(model, includeAssociations = null) {
    if (includeAssociations) {
        return db[model].findAll({include:includeAssociations})
    } else {
        return db[model].findAll()
    }
}
module.exports = {
    findAndCountAllPages,
    findOne,
    findAll
}