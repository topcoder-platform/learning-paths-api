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

    const createDate = new Date();

    await queryInterface.bulkInsert('TopcoderCertification', [
      {
        title: 'Web Development Certification',
        description: 'Covers all the basics of front-end and back-end web development',
        estimatedCompletionTime: 600,
        status: 'active',
        certificationCategoryId: webId,
        learnerLevel: 'All Levels',
        version: createDate,
        skills: ['web development', 'Javascript', 'APIs'],
        stripeProductId: 'prod_MzAGVmH4YG42lA'
      },
      {
        title: 'Data Science Certification',
        description: 'Learn the basics of data science along with practical applications',
        estimatedCompletionTime: 600,
        status: 'active',
        certificationCategoryId: dataSciId,
        learnerLevel: 'All Levels',
        version: createDate,
        skills: ['data structures', 'machine learning', 'AI'],
        stripeProductId: 'prod_MyBDpJ53eSVYRr'
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TopcoderCertification', null, {});
  }
};
