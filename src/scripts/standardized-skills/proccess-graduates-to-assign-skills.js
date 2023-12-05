/**
 * This script iterates all TCA graduates and assigns them the skills they have earned from the TCA course and/or certification.
 * Skills are assigned as verified skills and will be visible on member profiles.
 * 
 * To be run against the production database the user must be connected to 
 * the VPN and the database connection string must be updated to point to 
 * the production RDS instance.
 */

const db = require('../../db/models')
const helper = require('../../common/helper');
const { Op } = require("sequelize");
const config = require('config');
const { v4: uuidv4 } = require('uuid');

const LIVE_RUN = process.env.LIVE_RUN_SCRIPT ? process.env.LIVE_RUN_SCRIPT === 'true' : false

async function getCompletedEnrollments() {
    const enrollments = await db.CertificationEnrollment.findAll({
        where: {
            completionUuid: {
                [Op.not]: null
            },
            completionEventId: null
        },
        attributes: ['id', 'topcoderCertificationId', 'userId'],
        include: [
            {
                model: db.TopcoderCertification,
                as: 'topcoderCertification',
            }
        ]
    })

    return enrollments;
}

async function getCompletedCourseProgressess() {
    const completedCourseProgressess = await db.FccCertificationProgress.findAll({
        where: {
            status: 'completed',
            completionEventId: null
        },
        attributes: ['id', 'userId', 'fccCourseId'],
        include: [
            {
                model: db.FccCourse,
                as: 'fccCourse',
            }
        ]
    })

    return completedCourseProgressess;
}


(async () => {
    console.log(`** LIVE_RUN: ${LIVE_RUN}`);
    // TCA certs
    const enrollments = await getCompletedEnrollments();
    if (enrollments.length > 0) {
        console.log(`** Processing ${enrollments.length} completed enrollments`)

        for (let enrollment of enrollments) {
            console.log(`** Processing enrollment: ${JSON.stringify(enrollment)}`);

            const payload = {
                id: uuidv4(),
                type: 'certification',
                graduate: {
                    userId: Number(enrollment.userId),
                },
                skills: enrollment.topcoderCertification.skills.map(skill => ({ id: skill }))
            };

            console.log(`** Kafka payload: ${JSON.stringify(payload)}`);

            if (LIVE_RUN) {
                // post Kafka event to assign skills
                await helper.postBusEvent(config.KAFKA_TCA_COMPLETION_TOPIC, payload);

                // store the event id on the enrollment for future reference
                await enrollment.update({
                    completionEventId: payload.id
                });

                // pause for 3 seconds to avoid overloading the Kafka topic
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            console.log(`** Processed enrollment id: ${enrollment.id} successfully`);
        }
    } else {
        console.log("** No completed enrollments found");
    }

    // TCA courses
    const completedCourseProgressess = await getCompletedCourseProgressess();
    if (completedCourseProgressess.length > 0) {
        console.log(`** Processing ${completedCourseProgressess.length} completed course progressess`)

        for (let courseProgress of completedCourseProgressess) {
            console.log(`** Processing courseProgress: ${JSON.stringify(courseProgress)}`);

            const payload = {
                id: uuidv4(),
                type: 'course',
                graduate: {
                    userId: Number(courseProgress.userId),
                },
                skills: courseProgress.fccCourse.skills.map(skill => ({ id: skill }))
            };

            console.log(`** Kafka payload: ${JSON.stringify(payload)}`);

            if (LIVE_RUN) {
                // post Kafka event to assign skills
                await helper.postBusEvent(config.KAFKA_TCA_COMPLETION_TOPIC, payload);

                // store the event id on the enrollment for future reference
                await courseProgress.update({
                    completionEventId: payload.id
                });

                // pause for 3 seconds to avoid overloading the Kafka topic
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            console.log(`** Processed course progress id: ${courseProgress.id} successfully`);
        }
    } else {
        console.log("** No completed course progressess found");
    }
})();
