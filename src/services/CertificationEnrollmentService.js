
const db = require('../db/models');

/**
 * Enrolls a user in a Topcoder Certification 
 * 
 * @param {Integer} certificationId the ID of the Topcoder Certification
 * @param {String} userId the ID of the user enrolling in the certification
 * @returns {Object} the newly created CertificationEnrollment object
 */
async function enrollUser(userId, certificationId) {

    const existingEnrollment = await getExistingEnrollment(userId, certificationId);
    // console.log('existingEnrollment', existingEnrollment);

    if (existingEnrollment != null) {
        const certification = existingEnrollment.topcoderCertification;
        console.log(`User ${userId} is already enrolled in certification ${certification.title}`);

        return existingEnrollment;
    }

    const newEnrollment = await createCertificationEnrollment(certificationId, userId)

    return newEnrollment;
}

async function getExistingEnrollment(userId, certificationId) {
    const options = {
        where: {
            topcoderCertificationId: certificationId,
            userId: userId
        },
        include: {
            model: db.TopcoderCertification,
            as: 'topcoderCertification'
        }
    }

    return await getEnrollment(options)
}

async function getEnrollment(options = {}) {
    const enrollment = await db.CertificationEnrollment.findOne(options);

    return enrollment;
}

async function getEnrollmentById(id) {
    const options = {
        include: {
            model: db.TopcoderCertification,
            as: 'topcoderCertification'
        }
    }

    return await db.CertificationEnrollment.findByPk(id, options);
}

async function createCertificationEnrollment(certificationId, userId, userHandle = null) {

    const enrollmentAttrs = {
        topcoderCertificationId: certificationId,
        userId: userId,
        userHandle: userHandle,
        resourceProgresses: buildProgressAttrs(userId, certificationId)
    }

    try {
        const enrollment = db.CertificationEnrollment.create(enrollmentAttrs);
        return enrollment;
    } catch (error) {
        console.error("Error creating certification enrollment", error);
        return null;
    }
}

async function buildProgressAttrs(userId, certificationId) {
    const certification = await db.TopcoderCertification.findByPk(certificationId, {
        include: {
            model: db.CertificationResource,
            as: 'certificationResources',
            include: {
                model: db.FreeCodeCampCertification,
                as: 'freeCodeCampCertification',
                include: {
                    model: db.FccCertificationProgress,
                    as: 'certificationProgresses',
                    where: {
                        userId: userId
                    }
                }
            }
        }
    })

    let progressAttrs = [];
    for (const resource of certification.certificationResources) {
        const fccCert = resource.freeCodeCampCertification
        const progress = fccCert?.certificationProgresses

        const resourceProgress = {
            certificationResourceId: resource.id,
            resourceProgressId: progress ? progress.id : null,
            resourceProgressType: progress ? progress.constructor.name : null,
        }
    }
}

module.exports = {
    createCertificationEnrollment,
    enrollUser,
    getEnrollment,
    getEnrollmentById
}