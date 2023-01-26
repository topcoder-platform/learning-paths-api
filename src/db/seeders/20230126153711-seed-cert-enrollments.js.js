'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cert = await queryInterface.sequelize.query(
      `SELECT id from "TopcoderCertification"`
    )
    const certId1 = cert[0][0].id;
    const certId2 = cert[0][1].id;

    await queryInterface.bulkInsert('CertificationEnrollments',
      [{
        topcoderCertificationId: certId1,
        userId: '88774619',
        userHandle: 'kirildev',
        status: 'enrolled', // default can skip
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        topcoderCertificationId: certId2,
        userId: '88774619',
        userHandle: 'kirildev',
        status: 'completed',
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CertificationEnrollments', null, {});
  }
};
