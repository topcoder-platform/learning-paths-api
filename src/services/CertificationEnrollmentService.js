
const db = require('../db/models');

/**
 * Enrolls a user in a Topcoder Certification 
 * 
 * @param {Integer} certificationId the ID of the Topcoder Certification
 * @param {String} userId the ID of the user enrolling in the certification
 * @returns {Object} the newly created CertificationEnrollment object
 */
async function enrollUser(certificationId, userId) {
    const options = {
        where: {
            topcoderCertification: certificationId,
            userId: userId
        },
        include: {
            model: db.TopcoderCertification,
            as: 'topcoderCertification'
        }
    }
    const existingEnrollment = getEnrollment(options)
    console.log('existingEnrollment', existingEnrollment);

    if (existingEnrollment != null) {
        const certification = existingEnrollment.topcoderCertification;
        console.log(`User ${userId} is already enrolled in certification ${certification}`);

        return existingEnrollment;
    }

    const newEnrollment = await createCertificationEnrollment(certificationId, userId)

    return newEnrollment;
}

async function getEnrollment(options = {}) {
    const enrollment = db.CertificationEnrollment.findOne(options);

    return enrollment;
}

async function getEnrollmentById(id) {
    return await db.CertificationEnrollment.findByPk(id);
}

async function createCertificationEnrollment(certificationId, userId, userHandle = null) {
    const attrs = {
        topcoderCertificationId: certificationId,
        userId: userId,
        userHandle: userHandle,
    }
    try {
        const enrollment = db.CertificationEnrollment.create(attrs);
        return enrollment;
    } catch (error) {
        console.error("Error creating certification enrollment", error);
        return null;
    }
}

module.exports = {
    createCertificationEnrollment,
    enrollUser,
    getEnrollment,
    getEnrollmentById
}