/**
 * This tool clones the development TCA data into the user's local Postgres database.
 * 
 * It copies data from the following tables:
 *  - CertificationEnrollment 
 *  - CertificationResourceProgress 
 *  - FccCertificationProgress
 *  - FccCompletedLesson 
 *  - FccCourse 
 *  - FccLesson 
 *  - FccModule
 *  - FccModuleProgress
 * 
 */

const db = require('../../db/models');
const remoteDb = require('./remoteDb');

// Note: tables are listed here in order of foreign key constraints
const tables = [
    'CertificationCategory',
    'ResourceProvider',
    'FreeCodeCampCertification',
    'FccCourse',
    'FccModule',
    'FccLesson',
    'FccCertificationProgress',
    'FccModuleProgress',
    'FccCompletedLesson',
    'TopcoderCertification',
    'CertificationResource',
    'CertificationEnrollment',
    'CertificationResourceProgress',
];

// Check connection to local DB and that tables are empty before proceeding
async function checkLocalDb() {
    for (let table of tables) {
        const count = await db[table].count();
        if (count > 0) {
            console.log(`** Table ${table} is not empty. Please empty it before proceeding.`);
            return false;
        }
    }

    console.log('** Local DB is ready to copy data from remote DB.');
    return true;
}

// Check connection to remote DB 
async function checkRemoteDb() {
    try {
        await remoteDb.sequelize.authenticate();
        console.log('** Connection to remote DB has been established successfully.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the remote database:', error);
        return false;
    }
}

// Copy data from remote DB to local DB
async function copyData() {
    console.log('** Copying data from remote DB to local DB...');

    for (let table of tables) {
        const data = await remoteDb[table].findAll();
        console.log(`Copying ${data.length} rows from ${table}...`);
        const dbObjects = data.map(row => row.dataValues);
        await db[table].bulkCreate(dbObjects);
    }
}

// Run the script

(async () => {
    if (!await checkLocalDb()) {
        return;
    }

    if (!await checkRemoteDb()) {
        return;
    }

    await copyData();
})();