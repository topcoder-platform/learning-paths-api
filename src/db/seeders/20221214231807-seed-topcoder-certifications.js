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
        dashedName: 'web-development-certification',
        description: 'Covers all the basics of front-end and back-end web development',
        status: 'active',
        certificationCategoryId: webId,
        learnerLevel: 'Beginner',
        version: createDate,
        skills: ['Web Development', 'JavaScript', 'APIs'],
        stripeProductId: 'prod_MzAGVmH4YG42lA',
        learningOutcomes: ['learningOutcomes'],
        prerequisites: ['There are no prerequisites for this certification.'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Data Science Certification',
        dashedName: 'data-science-certification',
        description: 'Learn the basics of data science along with practical applications',
        status: 'active',
        certificationCategoryId: dataSciId,
        learnerLevel: 'Beginner',
        version: createDate,
        skills: ['Data Structures', 'Machine Learning', 'AI'],
        stripeProductId: 'prod_MyBDpJ53eSVYRr',
        learningOutcomes: ['learningOutcomes'],
        prerequisites: ['There are no prerequisites for this certification.'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TopcoderCertification', null, {});
  }
};
