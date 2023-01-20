'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex(
      'FccCertificationProgresses',
      ['fccCertificationId', 'userId'], {
      unique: true
    }
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'FccCertificationProgresses',
      ['fccCertificationId', 'userId']
    )
  }
};
