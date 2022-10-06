const dbHelper = require('../../../common/helper')

/**
 * Gets all the Certification Progress records that are completed
 */
async function getAllCompleted() {

    const certificationProgresses = await dbHelper.scanAll('CertificationProgress')

    console.log(`Found ${certificationProgresses.length} certification progress records.`)

    const completedCertifications = certificationProgresses
        .filter(certProgress => certProgress.status === 'completed')

    console.log(`Found ${completedCertifications.length} completed certification progress records.`)

    return completedCertifications
}

module.exports = {
    getAllCompleted,
}
