'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const webCategory = await queryInterface.sequelize.query(
      `SELECT id from "CertificationCategory" where category = 'Web Development';`
    );
    const webId = webCategory[0][0].id;

    const dataSciCategory = await queryInterface.sequelize.query(
      `SELECT id from "CertificationCategory" where category = 'Data Science';`
    );
    const dataSciId = dataSciCategory[0][0].id;

    await queryInterface.bulkInsert('TopcoderCertification', [
      {
        title: 'Web Development Certification',
        description: 'Covers all the basics of front-end and back-end web development',
        estimatedCompletionTime: 600,
        certificationCategoryId: webId,
        learnerLevel: 'All Levels',
        version: new Date(),
        skills: ['web development', 'Javascript', 'APIs']
      },
      {
        title: 'Data Science Certification',
        description: 'Learn the basics of data science along with practical applications',
        estimatedCompletionTime: 600,
        certificationCategoryId: dataSciId,
        learnerLevel: 'All Levels',
        version: new Date(),
        skills: ['data structures', 'machine learning', 'AI']
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TopcoderCertification', null, {});
  }
};
