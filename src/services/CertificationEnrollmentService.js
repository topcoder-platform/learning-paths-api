
const _ = require('lodash');
const db = require('../db/models');
const errors = require('../common/errors');
const helper = require('../common/helper');
const config = require('config');
const certificationService = require('./TopcoderCertificationService');

/**
 * Enrolls a user in a Topcoder Certification 
 * 
 * @param {Integer} certificationId the ID of the Topcoder Certification
 * @param {Object} authUser the auth user from session
 * @returns {Object} the newly created CertificationEnrollment object
 */
async function enrollUser(authUser, certificationId) {

    const existingEnrollment = await getExistingEnrollment(authUser.userId, certificationId);

    if (existingEnrollment != null) {
        const certification = existingEnrollment.topcoderCertification;
        console.log(`User ${authUser.userId} is already enrolled in certification ID ${certificationId}: ${certification.title}`);

        return existingEnrollment;
    }

    const newEnrollment = await createCertificationEnrollment(authUser, certificationId)

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

/**
 * Query TCA certification enrollments for a specific enrollment
 * 
 * @param {Object} options query options
 * @returns {Object | null}
 */
async function getEnrollment(options = {}) {
    const enrollment = await db.CertificationEnrollment.findOne(options);

    return enrollment;
}

/**
 * Query TCA certification enrollments for all matching enrollments
 * 
 * @param {Object} options query options
 * @returns {Object | null}
 */
async function getEnrollments(options = {}) {
    const enrollment = await db.CertificationEnrollment.findAll(options);

    return enrollment;
}

/**
 * Get enrollment from the system
 * @param {*} id Either id or completionUuid
 * @returns {Object | null}
 */
async function getEnrollmentById(id) {
    const options = {
        include: {
            model: db.TopcoderCertification,
            as: 'topcoderCertification',
            include: certificationService.certificationIncludes()
        }
    };

    return !!Number(id)
        ? db.CertificationEnrollment.findByPk(id, options)
        : db.CertificationEnrollment.findOne({
            where: {
                completionUuid: id
            },
            ...options
        });
}

/**
 * Enrolls a user in a certification, creating all of the necessary progress tracking 
 * records in the process.
 * 
 * @param {Integer} certificationId the ID of the certification in which the user is enrolling
 * @param {Object} authUser the auth user data from jwt session
 * @returns the completed CertificationEnrollment object
 */
async function createCertificationEnrollment(authUser, certificationId) {
    const memberData = await helper.getMemberDataM2M(authUser.handle);

    const enrollmentAttrs = {
        topcoderCertificationId: certificationId,
        userId: authUser.userId,
        userHandle: authUser.handle,
        userName: `${memberData.firstName} ${memberData.lastName}`,
        resourceProgresses: await buildEnrollmentProgressAttrs(authUser.userId, certificationId)
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

        // set the attributes for creation of the 
        // CertificationResourceProgress records, including 
        // the status
        const resourceProgress = {
            certificationResourceId: resource.id,
            resourceProgressId: fccProgress.id,
            resourceProgressType: fccProgress.constructor.name,
            status: fccProgress.status,
        }

        resourceProgresses.push(resourceProgress);
    }

    return resourceProgresses;
}

async function createProgressRecord(userId, fccCertification) {
    return await db.FccCertificationProgress.buildFromCertification(userId, fccCertification);
}

/**
 * A convenience function to define a common set of Sequelize model 
 * associations to include in the CertificationEnrollment queries.
 * 
 * @returns an array of model associations
 */
function progressIncludes(certificationDashedName) {
    return [
        {
            model: db.TopcoderCertification,
            as: 'topcoderCertification',
            ...(!certificationDashedName ? {} : { where: { dashedName: certificationDashedName } }),
            include: {
                model: db.ResourceProvider,
                as: 'resourceProviders',
            }
        },
        {
            model: db.CertificationResourceProgress,
            as: 'resourceProgresses',
            include: {
                model: db.FccCertificationProgress,
                as: 'fccCertificationProgress',
            }
        }
    ]
}

async function getEnrollmentProgress(userId, certificationDashedName) {
    options = {
        where: {
            userId: userId,
        },
        include: progressIncludes(certificationDashedName),
    }

    const progress = await db.CertificationEnrollment.findOne(options);

    return progress;
}

/**
 * Gets all of a user's certification enrollments.
 * 
 * @param {String} userId the ID of the user
 * @returns an array of CertificationEnrollment objects along with additional nested data
 */
async function getUserEnrollmentProgresses(userId) {
    options = {
        where: {
            userId: userId
        },
        include: progressIncludes()
    }

    const progresses = await db.CertificationEnrollment.findAll(options)

    return progresses;
}

/**
 * Marks a CertificationResourceProgress record as completed. For example, 
 * when a user completes a FreeCodeCamp certification that's part of a Topcoder
 * Certification, the certification progress record needs to be updated to track 
 * the user's progress towards earning the certification. 
 * 
 * @param {Object} the auth user whose progress is being completed
 * @param {String} resourceProgressType type of certification resource
 * @param {Integer} resourceProgressId ID of the certification resource
 */
async function completeEnrollmentProgress(authUser, resourceProgressType, resourceProgressId) {
    const resourceProgress = await db.CertificationResourceProgress.findOne({
        where: {
            resourceProgressType: resourceProgressType,
            resourceProgressId: resourceProgressId
        }
    })
    // If there isn't a resource progress record then the user 
    // isn't enrolled in a Topcoder Certification containing 
    // this resource.
    if (!resourceProgress) return null;

    // Get the CertificationEnrollment for this progress -- it should
    // belong to the provider userID
    const certEnrollment = await db.CertificationEnrollment.findOne({
        where: {
            id: resourceProgress.certificationEnrollmentId,
            userId: authUser.userId
        }
    });

    // If an enrollment wasn't found for the given user, something is not right -- throw an error.
    if (!certEnrollment) {
        throw new errors.BadRequestError(`Resource progress ${resourceProgressType}/${resourceProgressId} does not belong to user ${authUser.userId}`)
    }

    // We have the certification resource progress and have verified it's for 
    // the given user, so mark it as complete.
    const completedProgress = await resourceProgress.setCompleted();

    const certification = await await certEnrollment.getTopcoderCertification();

    // When an individual cert resource progress is completed we need to check
    // to see if all of requirements for the associated Topcoder Certification 
    // have been completed. If so, we mark the Certification as completed and 
    // return that info to the client.
    const certCompletionStatus = await certEnrollment.checkAndSetCertCompletion(
        authUser.handle,
        certification.dashedName,
        `${config.TCA_WEBSITE_URL}/learn/tca-certifications/${certification.dashedName}/${authUser.handle}/certificate`,
        `[${config.CERT_ELEMENT_SELECTOR.attribute}=${config.CERT_ELEMENT_SELECTOR.value}]`
    );

    return {
        completedProgress: completedProgress,
        topcoderCertificationStatus: certCompletionStatus
    }
}

module.exports = {
    buildEnrollmentProgressAttrs,
    completeEnrollmentProgress,
    createCertificationEnrollment,
    enrollUser,
    getEnrollment,
    getEnrollmentById,
    getEnrollmentProgress,
    getEnrollments,
    getUserEnrollmentProgresses,
    unEnrollUser
}