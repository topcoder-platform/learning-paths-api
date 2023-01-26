
const _ = require('lodash');
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

    if (existingEnrollment != null) {
        const certification = existingEnrollment.topcoderCertification;
        console.log(`User ${userId} is already enrolled in certification ID ${certificationId}: ${certification.title}`);

        return existingEnrollment;
    }

    const newEnrollment = await createCertificationEnrollment(userId, certificationId)

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

async function unEnrollUser(userId, certificationId) {
    let enrollment = null;
    enrollment = await getExistingEnrollment(userId, certificationId);
    if (enrollment) {
        // The CertificationEnrollment model is setup to CASCADE DELETE
        // the associated CertificationProgress records automatically.
        await enrollment.destroy()
        console.log(`Unenrolled user ID ${userId} from certification ID ${certificationId}`)
    } else {
        console.warn(`User ID ${userId} is not enrolled in certification ID ${certificationId} -- cannot unenroll`)
    }

    return enrollment;
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

/**
 * Enrolls a user in a certification, creating all of the necessary progress tracking 
 * records in the process.
 * 
 * @param {Integer} certificationId the ID of the certification in which the user is enrolling
 * @param {String} userId the ID of the user who's enrolling
 * @param {String} userHandle optional handle of the enrolling user, if we have it (to make 
 *                 finding their info in the DB easier)
 * @returns the completed CertificationEnrollment object
 */
async function createCertificationEnrollment(userId, certificationId, userHandle = null) {
    const enrollmentAttrs = {
        topcoderCertificationId: certificationId,
        userId: userId,
        userHandle: userHandle,
        resourceProgresses: await buildEnrollmentProgressAttrs(userId, certificationId)
    }

    try {
        const enrollment = db.CertificationEnrollment.create(enrollmentAttrs,
            {
                include: [{
                    model: db.CertificationResourceProgress,
                    as: 'resourceProgresses'
                }]
            });
        return enrollment;
    } catch (error) {
        console.error("Error creating certification enrollment", error);
        return null;
    }
}

/**
 * Builds the attributes to track a user's enrollment and progress in a Topcoder 
 * Certification. 
 * 
 * @param {String} userId the ID of the user who's enrolling in the certification
 * @param {Integer} certificationId the ID of the certification in which they're enrolling
 */
async function buildEnrollmentProgressAttrs(userId, certificationId) {
    const certification = await getCertificationEnrollmentDetails(userId, certificationId);

    const resourceProgresses = await buildCertResourceProgressAttrs(userId, certification);

    return resourceProgresses;
}

/**
 * Get the Certification info and the resources it contains, along with 
 * any existing progress records (the user could have already completed 
 * one or more of the courses or be in-progress in them).
 * 
 * @param {String} userId the ID of the user who's enrolling
 * @param {Integer} certificationId the ID of the certification in which they're enrolling
 * @returns the TopcoderCertification object with associated FCC certs and user progress
 */
async function getCertificationEnrollmentDetails(userId, certificationId) {
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
                    // NOTE: +required: false+ below is needed here, otherwise the 
                    // freeCodeCampCertification won't be returned if the user 
                    // doesn't have a progress record for it (meaning they haven't
                    // started the course yet)
                    required: false,
                    where: {
                        userId: userId
                    }
                }
            }
        }
    })

    return certification;
}

/**
 *  Build the collection of CertificationResourceProgress objects that 
 *  will track the user's progress in this certification. For each resource
 *  in the Certification, link to the existing progress records (if any) and 
 *  create new progress records for any resources the user hasn't already 
 *  started or completed.
 * 
 * @param {Object} certification the Topcoder Certification for which progress
 *      records are being constructed.
 * @returns {Object} an object containing all the CertificationReourceProgress attributes
 */
async function buildCertResourceProgressAttrs(userId, certification) {
    let resourceProgresses = [];

    for (const resource of certification.certificationResources) {
        const fccCert = resource.freeCodeCampCertification
        let fccProgress = _.first(fccCert?.certificationProgresses)

        // if a progress record doesn't exist it means the user hasn't 
        // started this course yet, so enroll them in it by creating a
        // freeCodeCamp progress record.
        if (!fccProgress) {
            fccProgress = await createProgressRecord(userId, fccCert)
        }

        const resourceProgress = {
            certificationResourceId: resource.id,
            resourceProgressId: fccProgress.id,
            resourceProgressType: fccProgress.constructor.name
        }

        resourceProgresses.push(resourceProgress);
    }

    return resourceProgresses;
}

async function createProgressRecord(userId, fccCertification) {
    return await db.FccCertificationProgress.buildFromCertification(userId, fccCertification);
}

async function getEnrollmentProgress(enrollmentId) {
    const enrollment = db.CertificationEnrollment.findByPk(enrollmentId);

    return enrollment;
}

module.exports = {
    buildEnrollmentProgressAttrs,
    createCertificationEnrollment,
    enrollUser,
    getEnrollment,
    getEnrollmentById,
    getEnrollmentProgress,
    unEnrollUser
}