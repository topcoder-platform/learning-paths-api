'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'CertificationEnrollments',
      ['topcoderCertificationId', 'userId']
    );

    await queryInterface.addIndex(
      'CertificationEnrollments',
      ['topcoderCertificationId', 'userId'], {
      unique: true
    }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'CertificationEnrollments',
      ['topcoderCertificationId', 'userId']
    )
  }
};
