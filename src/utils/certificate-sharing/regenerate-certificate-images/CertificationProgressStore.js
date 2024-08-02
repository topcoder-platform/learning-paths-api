const dbHelper = require('../../../common/dbHelper')

/**
 * Gets all the FCC Certification Progress records that are completed
 */
async function getAllCompleted() {

    const certificationProgresses = await dbHelper.findAll('FccCertificationProgress', ['resourceProvider'])
    console.log(`Found ${certificationProgresses.length} certification progress records.`)
    const completedCertifications = certificationProgresses
        .filter(certProgress => certProgress.status === 'completed')
    console.log(`Found ${completedCertifications.length} completed certification progress records.`)

    return completedCertifications
}

/**
 * Gets all the TCA Certification Progress records that are completed
 */
async function getAllCompletedTCA() {

    const certificationProgresses = await dbHelper.findAll('CertificationEnrollment')
    console.log(`Found ${certificationProgresses.length} TCA certification progress records.`)
    const completedCertifications = certificationProgresses
        .filter(certProgress => certProgress.status === 'completed')
    console.log(`Found ${completedCertifications.length} completed TCA certification progress records.`)

    return completedCertifications
}
module.exports = {
    getAllCompleted,
    getAllCompletedTCA
}
