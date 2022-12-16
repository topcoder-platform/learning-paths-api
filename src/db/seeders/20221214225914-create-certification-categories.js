'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('CertificationCategory', [
      {
        category: 'Web Development',
        track: 'DEV',
      },
      {
        category: 'Data Science',
        track: 'DEV',
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CertificationCategory', null, {});
  }
};
