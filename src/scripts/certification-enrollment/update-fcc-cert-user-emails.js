/**
 * This script updates the email address for users who have completed an 
 * FccCertificationProgress record but do not have an email address in the 
 * record due to the Wipro SSO-assigned user ID not matching the Topcoder-
 * assigned user ID.
 * 
 * To be run against the production database the user must be connected to 
 * the VPN and the database connection string must be updated to point to 
 * the production RDS instance.
 * 
 * The +fcc-member-data.csv+ file should contain all of the user IDs and email 
 * combinations to be updated. It must be placed in the same directory as this 
 * file and should include the columns +email+ and +userId+. This file is gitignored
 * so it doesn't end up in source control.
 */

// This tool has been deprecated and is no longer used. It is left here for reference.
console.error("** This tool has been deprecated and is no longer used. **");
return;

const fs = require("fs");
const csvParser = require("csv-parser");
const { Op } = require("sequelize");
const path = require('path');

const db = require('../../db/models')

function getCsvData() {
    let csvData = [];
    const csvPath = path.join(__dirname, 'fcc-member-data.csv');

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

async function updateFccCertUserEmails(data) {
    console.log(`Updating ${data.length} users...`);
    let rowCount = 0;

    for (let user of data) {
        const { email, userId } = user;
        try {
            console.log(`Updating user ${userId} with email ${email}...`)
            const rows = await db.FccCertificationProgress.update({ email: email }, {
                where: {
                    [Op.and]: {
                        userId: userId,
                        email: { [Op.is]: null }
                    }
                }
            });
            console.log(`Updated ${rows[0]} rows for ${userId}`);
            rowCount += rows[0];
        } catch (error) {
            console.log(`Error updating user ${userId}`, error);
        }
    }

    console.log(`Updated a total of ${rowCount} rows`);
}

(async () => {
    const data = await getCsvData();
    await updateFccCertUserEmails(data);
})();