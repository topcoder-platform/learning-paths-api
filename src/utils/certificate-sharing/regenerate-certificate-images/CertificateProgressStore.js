const dbHelper = require('../../../common/helper')

/**
 * Gets all the Certificate Progress records that are completed
 */
async function getAllCompleted() {

    const certificationProgresses = await dbHelper.scanAll('CertificationProgress')

    console.log(`Found ${certificationProgresses.length} progress records.`)

    const completedCertifications = certificationProgresses
        .filter(certProgress => certProgress.status === 'completed')

    console.log(`Found ${completedCertifications.length} completed progress records.`)

    return completedCertifications
}

module.exports = {
    getAllCompleted,
}
