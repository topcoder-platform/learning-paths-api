'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cert = await queryInterface.sequelize.query(
      `SELECT id from "TopcoderCertification" where title = 'Web Development Certification'`
    );
    const certId = cert[0][0].id;

    const resources = await queryInterface.sequelize.query(
      `SELECT id, "resourceTitle" from "CertificationResource" order by "displayOrder"`
    );

    const [webDevResource, algoResource] = resources;

    const enrollment = {
      topcoderCertificationId: certId,
      userId: '88778750',
      userHandle: 'testflyjets',
      resourceProgresses: [
        {
          certificationResourceId: webDevResource.id,
          status: 'in-progress',
          resourceProgressType: 'FccCourseProgress',
          resourceProgressId: webDevProgressId
        },
        {
          certificationResourceId: algoResource.id,
          status: 'in-progress',
          resourceProgressType: 'FccCourseProgress',
          resourceProgressId: algoProgressId
        }
      ]
    }

    // await db.CertificationEnrollment.create(enrollment, {
    //   include: {
    //     model: db.CertificationResourceProgress,
    //     as: 'certificationProgresses',
    //   }
    // });

  },

  async down(queryInterface, Sequelize) {

  }
};
