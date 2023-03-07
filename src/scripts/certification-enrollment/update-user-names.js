/**
 * This script is intended to be run once to update user names in 
 * Topcoder Certification enrollments via the member API. This was 
 * necessary due to an error in accessing the machine-to-machine (m2m)
 * token necessary to connect to the member API in production.
 */

const db = require('../../db/models')
const helper = require('../../common/helper');
const { Op } = require("sequelize");

const LIVE_RUN = process.env.LIVE_RUN_SCRIPT ? process.env.LIVE_RUN_SCRIPT === 'true' : false

async function getEnrollmentHandles() {
    const handles = await db.CertificationEnrollment.findAll({
        where: {
            userHandle: {
                [Op.col]: 'CertificationEnrollment.userName'
            }
        },
        attributes: ['id', 'userHandle']
    })

    return handles.map(h => {
        return {
            id: h.id,
            handle: h.userHandle
        }
    });
}

async function getUserNamesForHandles(enrollments) {
    let enrollmentsWithNames = []
    for (let enrollment of enrollments) {
        const memberData = await helper.getMemberDataM2M(enrollment.handle);
        userFullName = `${memberData.firstName} ${memberData.lastName}`
        const enrollmentWithName = {
            ...enrollment,
            userName: userFullName
        }
        enrollmentsWithNames.push(enrollmentWithName)
    }

    return enrollmentsWithNames;
};

async function updateEnrollments(enrollments) {
    for (let enroll of enrollments) {
        const enrollment = await db.CertificationEnrollment.findByPk(enroll.id)
        if (LIVE_RUN) {
            console.log(`Updating enrollment ${enroll.id} for handle ${enroll.handle} to user name ${enroll.userName}`)
            await enrollment.update({ userName: enroll.userName })
        } else {
            console.log(`** DRY RUN: Would update enrollment ${enroll.id} for handle ${enroll.handle} to user name ${enroll.userName}`)
        }
    }
}

(async () => {
    const handles = await getEnrollmentHandles();
    if (handles.length > 0) {
        console.log(`** Updating ${handles.length} enrollment user names`)
        const names = await getUserNamesForHandles(handles);
        await updateEnrollments(names);
    } else {
        console.log("** No enrollments found that need user name updates")
    }
})();