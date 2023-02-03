/**
 * This service provides operations on FreeCodeCamp certification progress
 * data stored in Postgres.
 */

const db = require('../db/models');

const {
    progressStatuses,
    resourceProviders,
} = require('../common/constants');

async function searchCertificationProgresses(query) {
    const userId = query.userId;

    let options = {
        where: {
            userId: userId
        },
        include: [
            {
                model: db.ResourceProvider,
                as: 'resourceProvider',
                attributes: ['id', 'name', 'description', 'attributionStatement', 'url'],
                through: { attributes: [] }
            }
        ]
    }

    const progresses = await db.FccCertificationProgress.findAll(options);
    return progresses

    // let queryStatement = CertificationProgress.
    //     query("userId").eq(userId).
    //     using("userCertificationProgressIndex")

    // if (query.certification) {
    //     queryStatement = queryStatement.where("certification").eq(query.certification)
    // }
    // if (query.certificationId) {
    //     queryStatement = queryStatement.where("certificationId").eq(query.certificationId)
    // }
    // if (query.provider) {
    //     queryStatement = queryStatement.where("provider").eq(query.provider)
    // }
    // if (query.courseId) {
    //     queryStatement = queryStatement.where("courseId").eq(query.courseId)
    // }

    // try {
    //     let progresses = await queryStatement.exec();
    //     decorateProgresses(progresses);

    //     return progresses;
    // } catch (error) {
    //     console.error(error);
    //     return [];
    // }
}

module.exports = {
    searchCertificationProgresses,
}
