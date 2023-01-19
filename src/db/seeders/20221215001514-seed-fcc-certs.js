'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const webCategory = await queryInterface.sequelize.query(
      `SELECT id from "CertificationCategory" where category = 'Web Development';`
    );
    const webId = webCategory[0][0].id;

    const fccCerts = await queryInterface.bulkInsert('FreeCodeCampCertification',
      [{
        fccId: "9bd93a8a-1fcb-405a-b2e3-4a283915bbca",
        key: "responsive-web-design-certification",
        providerCertificationId: "561add10cb82ac38a17513bc",
        title: "Responsive Web Design Certification",
        certification: "responsive-web-design",
        completionHours: 300,
        learnerLevel: "Intermediate",
        state: "active",
        certificationCategoryId: webId,
        certType: "certification",
        publishedAt: new Date(Date.parse("2022-08-31T12:00:00Z")),
        createdAt: new Date(Date.parse("2022-08-31T12:00:00Z")),
        updatedAt: new Date(Date.parse("2022-08-31T12:00:00Z"))
      },
      {
        fccId: "aae0ba52-18fe-4c8e-ac4f-fd55715c8b5d",
        key: "javascript-algorithms-and-data-structures-certification",
        providerCertificationId: "561abd10cb81ac38a17513bc",
        title: "JavaScript Algorithms and Data Structures Certification",
        certification: "javascript-algorithms-and-data-structures",
        completionHours: 300,
        learnerLevel: "Expert",
        state: "active",
        certificationCategoryId: webId,
        certType: "certification",
        publishedAt: new Date(Date.parse("2022-09-05T12:00:00Z")),
        createdAt: new Date(Date.parse("2022-09-05T12:00:00Z")),
        updatedAt: new Date(Date.parse("2022-09-05T12:00:00Z"))
      }],
      { returning: true });

    console.log('FCC Certs added', fccCerts);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FreeCodeCampCertification', null, {});
  }
};
