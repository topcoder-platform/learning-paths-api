
const TCA_DATASTORE_POSTGRES = 'postgres';

/**
 * In the transition of TCA from DyanamoDB to Postgres several of the services
 * have been modified to support both data stores. A TCA_DATASTORE environment 
 * variable is used to toggle between them, with the value 'postgres' used to 
 * trigger PostgreSQL actions. In order to migrate data from DynamoDB all of the 
 * services need to execute the code paths for DynamoDB, so if we have the 
 * TCA_DATASTORE env var set to 'postgres', we can't run the migrations. Check 
 * for that here.
 * 
 * @returns boolean true if Postgres is set as the datastore, false otherwise
 */
function tcaDatastoreIsPostgres() {
    return process.env.TCA_DATASTORE === TCA_DATASTORE_POSTGRES;
}

module.exports = {
    tcaDatastoreIsPostgres,
}