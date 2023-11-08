/**
 * This service provides operations on Topcoder Certifications
 */

const db = require('../db/models')
const errors = require('../common/errors')
const { expandSkillsM2M } = require('../common/helper')
const Joi = require('joi')

const DEFAULT_PAGE_LIMIT = 10

/**
 * Search Certifications
 * 
 * @param {Object} criteria the search criteria
 * @returns {Object} the search result
 */
async function searchCertifications(query = {}) {
    const dbQuery = {
        include: certificationIncludes(),
        offset: query.offset || 0,
        limit: query.limit || DEFAULT_PAGE_LIMIT,
        order: [
            ['title', 'ASC'],
        ],
    };
    // check for order params
    if (query.order_by || query.order_type) {
        dbQuery.order = [[query.order_by || 'title', query.order_type || 'ASC']]
    }

    return await db.TopcoderCertification.findAll(dbQuery)
}

/**
 * Get Certification by ID
 * 
 * @param {String} id the certification ID
 * @returns {Object} the certification with given ID
 */
async function getCertification(id) {
    const options = {
        include: certificationIncludes()
    }

    const cert = await db.TopcoderCertification.findByPk(id, options)

    if (cert && cert.skills) {
        cert.skills = await expandSkillsM2M(cert.skills)
    }

    return cert
}

/**
 * Get Certification by DashedName
 * 
 * @param {String} dashedName the certification dashed name
 * @returns {Object} the certification with given dashed name
 */
async function getCertificationByDashedName(dashedName) {
    const options = {
        where: {
            dashedName,
        },
        include: certificationIncludes()
    }

    const cert = await db.TopcoderCertification.findOne(options)

    if (cert && cert.skills) {
        cert.skills = await expandSkillsM2M(cert.skills)
    }

    return cert
}

/**
 * Provides the list of Sequelize model associations that should
 * be included when querying TopcoderCertifications
 * 
 * @returns Array of model includes 
 */
function certificationIncludes() {
    return [
        {
            model: db.CertificationResource,
            as: 'certificationResources',
            include: [
                {
                    model: db.FreeCodeCampCertification,
                    as: 'freeCodeCampCertification',
                    include: [
                        {
                            model: db.CertificationCategory,
                            as: 'certificationCategory',
                            attributes: ['category', 'track']
                        },
                        {
                            model: db.FccCourse,
                            as: 'course',
                            attributes: ['estimatedCompletionTimeUnits', 'estimatedCompletionTimeValue'],
                            include: {
                                model: db.FccModule,
                                as: 'modules',
                                attributes: ['estimatedCompletionTimeValue', 'estimatedCompletionTimeUnits']
                            }
                        }
                    ]
                },
                // TODO: leaving this here as an example of how we will 
                // need to handle the polymorphic association between resources
                // and the underlying course data. We are only currently 
                // using FreeCodeCamp certifications.

                // {
                //     model: db.TopcoderUdemyCourse,
                //     as: 'TopcoderUdemyCourse'
                // }
            ],
        },
        {
            model: db.CertificationCategory,
            as: 'certificationCategory'
        },
        {
            model: db.ResourceProvider,
            as: 'resourceProviders',
        }]
}

/**
 * Validates cert ownership for member handle
 * @param {*} topcoderCertificationId 
 * @param {*} userHandle 
 * @returns 
 */
async function validateCertOwnership(topcoderCertificationId, userHandle) {
    const enrollment = await db.CertificationEnrollment.findOne({
        where: {
            topcoderCertificationId,
            userHandle,
        }
    })

    if (!enrollment) {
        throw new errors.NotFoundError(`Enrollment of member '${userHandle}' for cert id '${topcoderCertificationId}' does not exist.`)
    }

    const certificationProgresses = await db.CertificationResourceProgress.findAll({
        where: {
            certificationEnrollmentId: enrollment.id
        }
    })

    if (!certificationProgresses || !certificationProgresses.length) {
        throw new errors.NotFoundError(`Enrollment progresses for enrollemnt id '${enrollment.id}' do not exist.`)
    }

    // make sure all progresses are with status `completed`
    const allCompleted = certificationProgresses.every(cp => cp.status === 'completed')

    if (!allCompleted) {
        throw new errors.UnauthorizedError(`Not all resources in enrollemnt id '${enrollment.id}' are completed.`)
    }

    return enrollment
}

/**
 * Update existing TopcoderCertification
 * 
 * @param {*} cert TopcoderCertification instance
 * @param {*} data Data to update the model with
 * @returns 
 */
async function updateCertification(cert, data) {
    return cert.update(data)
}

/**
 * Validate update cert payload with Joi schema
 * 
 * @param {*} payload Any
 */
function validateCertificationUpdate(payload) {
    const schema = Joi.object({
        // TODO: only skills are currently supported for updates. Add more fields here as needed.
        skills: Joi.array().items(Joi.string().guid().required()).required(),
    })

    const { error, value } = schema.validate(payload)
    
    if (error) {
      throw error
    }

    return value
}

module.exports = {
    searchCertifications,
    getCertification,
    getCertificationByDashedName,
    validateCertOwnership,
    certificationIncludes,
    updateCertification,
    validateCertificationUpdate,
}
