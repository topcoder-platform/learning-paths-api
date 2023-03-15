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

const db = require('../../db/models')
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

async function getUserProfiles(emailData) {
    const emails = emailData.map(user => user.email);
    const userData = await helper.getMultiUserDataFromEmails(emails);

    return userData;
}

(async () => {
    const emails = await getCsvData();
    const userData = await getUserProfiles(emails);
    console.log(userData);

    // const userMap = new Map();

    // userData.forEach(user => {
    //     userMap.set(user.email, user);
    // });

    // const updateData = csvData.map(user => {
    //     const profile = userMap.get(user.email);
    //     return {
    //         email: user.email,
    //         externalId: profile.externalId
    //     }
    // });

    // if (LIVE_RUN) {
    //     await db.CertificationProgress.bulkWrite(updateData.map(user => {
    //         return {
    //             updateOne: {
    //                 filter: { email: user.email },
    //                 update: { $set: { externalId: user.externalId } }
    //             }
    //         }
    //     }));
    // }

    // console.log(updateData);
})();