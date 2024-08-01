const dbHelper = require('../../../common/dbHelper')

/**
 * Gets all the Certification Progress records that are completed
 */
async function getAllCompleted() {

    const certificationProgresses = await dbHelper.findAll('FccCertificationProgress', ['resourceProvider'])

    console.log(`Found ${certificationProgresses.length} certification progress records.`)

    const completedCertifications = certificationProgresses
        .filter(certProgress => certProgress.status === 'completed')

    console.log(`Found ${completedCertifications.length} completed certification progress records.`)

    return completedCertifications
}

module.exports = {
    getAllCompleted,
}
