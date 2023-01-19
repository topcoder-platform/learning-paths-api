
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
        resourceProgresses: buildEnrollmentProgressAttrs(userId, certificationId)
    }

    try {
        const enrollment = db.CertificationEnrollment.create(enrollmentAttrs);
        return enrollment;
    } catch (error) {
        console.error("Error creating certification enrollment", error);
        return null;
    }
}

async function buildEnrollmentProgressAttrs(userId, certificationId) {
    // Get the Certification info and the resources it contains, along with 
    // any existing progress records (the user could have already completed 
    // one or more of the courses or be in-progress in them)
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
                    // NOTE: +required: false+ below is needed here, otherwise the freeCodeCampCertification
                    // won't be returned if the user doesn't have a progress record for it.
                    required: false,
                    where: {
                        userId: userId
                    }
                }
            }
        }
    })
    // console.log('certification', JSON.stringify(certification, null, 2));

    // Build the collection of CertificationResourceProgress objects that 
    // will track the user's progress in this certification. For each resource
    // in the Certification, link to the existing progress records (if any) and 
    // create new progress records for any resources the user hasn't already 
    // started or completed.
    let resourceProgresses = [];
    for (const resource of certification.certificationResources) {
        const fccCert = resource.freeCodeCampCertification
        const fccProgress = _.first(fccCert?.certificationProgresses)

        const resourceProgress = {
            fccCertification: fccCert,
            certificationResourceId: resource.id,
            resourceProgressId: fccProgress ? fccProgress.id : null,
            resourceProgressType: fccProgress ? fccProgress.constructor.name : null,
        }

        resourceProgresses.push(resourceProgress);
    }

    // For each certification resource, check to see if an existing progress
    // record exists, meaning the user has already enrolled in or completed 
    // the associated course. If not, create the progress record by enrolling
    // them in the course.
    for (const resourceProgress of resourceProgresses) {
        if (resourceNeedsProgressRecord(resourceProgress)) {
            createProgressRecord(userId, resourceProgress)
        }
    }
    // console.log('resourceProgresses', resourceProgresses);
}

function resourceNeedsProgressRecord(progress) {
    return (progress.resourceProgressId === null)
}

async function createProgressRecord(userId, resourceProgress) {
    const fccCert = resourceProgress.fccCertification
    const newProgress = db.FccCertificationProgress.buildFromCertification(fccCert);
}

module.exports = {
    buildEnrollmentProgressAttrs,
    createCertificationEnrollment,
    enrollUser,
    getEnrollment,
    getEnrollmentById
}