/**
 * This script is intended to be run once to update user emails in 
 * FreeCodeCamp certification progresses via the user API. This was
 * necessary due to how Wipro SSO users' external IDs were generated. These
 * IDs don't match the external ID that Topcoder.com users receive, causing 
 * a mismatch between what's stored in FCC's MongoDB and what's in our DB. 
 * This causes the MongoDB trigger update of completed lessons to fail for 
 * these users because the external ID doesn't contain the corresponding 
 * user ID in the cert progress table.
 */
const fs = require("fs");
const csvParser = require("csv-parser");

// const db = require('../../db/models')
const helper = require('../../common/helper');
const path = require('path');

const LIVE_RUN = process.env.LIVE_RUN_SCRIPT ? process.env.LIVE_RUN_SCRIPT === 'true' : false

function getCsvData() {
    let csvData = [];
    const csvPath = path.join(__dirname, 'fcc-mongodb-prod.csv');

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .on('error', error => {
                reject(error);
            })
            .pipe(csvParser())
            .on("data", (data) => {
                csvData.push(data);
            })
            .on("end", () => {
                resolve(csvData);
            });
    });
}

async function getUserProfiles(emailData, resolveCallback) {
    const emails = emailData.map(user => user.email);
    try {
        await helper.getMultiUserDataFromEmails(emails.slice(0, 3), resolveCallback);
    } catch (error) {
        console.log('Error getting user profile');
    }
}

function updateUser(response) {
    if (response === null) return;

    const content = response.result.content;
    const user = content[0];
    console.log('Update user: ', user);
}

(async () => {
    const emails = await getCsvData();
    const userData = await getUserProfiles(emails, updateUser);
})();