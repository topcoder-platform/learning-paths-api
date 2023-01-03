const db = require('../db/models');
const helper = require('../common/helper');

async function dbHealthCheck() {
    const provider = await db.ResourceProvider.findOne()
    if (!provider) {
        throw "Postgres error: No ResourceProviders found";
    }
}

function usePostgresFF() {
    return helper.featureFlagSet('TCA_DATASTORE', 'postgres')
}

module.exports = {
    dbHealthCheck,
    usePostgresFF
}