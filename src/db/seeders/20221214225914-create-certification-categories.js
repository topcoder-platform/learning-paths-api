'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const createDate = new Date();

    await queryInterface.bulkInsert('CertificationCategory', [
      {
        category: 'Web Development',
        track: 'DEV',
        createdAt: createDate,
        updatedAt: createDate
      },
      {
        category: 'Data Science',
        track: 'DATASCIENCE',
        createdAt: createDate,
        updatedAt: createDate
      },
      {
        category: 'Quality Assurance',
        track: 'QA',
        createdAt: createDate,
        updatedAt: createDate
      },
      {
        category: 'Information Security',
        track: 'SECURITY',
        createdAt: createDate,
        updatedAt: createDate
      },
      {
        category: 'Coding Interviews',
        track: 'INTERVIEW',
        createdAt: createDate,
        updatedAt: createDate
      },
      {
        category: 'Database',
        track: 'DEV',
        createdAt: createDate,
        updatedAt: createDate
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CertificationCategory', null, {});
  }
};
