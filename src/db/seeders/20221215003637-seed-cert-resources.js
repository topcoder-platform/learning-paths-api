'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const fccProvider = await queryInterface.sequelize.query(
      `SELECT id from "ResourceProvider" where name = 'freeCodeCamp';`
    );
    const providerId = fccProvider[0][0].id;

    const webDevCert = await queryInterface.sequelize.query(
      `SELECT id from "FreeCodeCampCertification" where key = 'responsive-web-design-certification';`
    );
    const webCertId = webDevCert[0][0].id;

    const algoCert = await queryInterface.sequelize.query(
      `SELECT id from "FreeCodeCampCertification" where key = 'javascript-algorithms-and-data-structures-certification';`
    );
    const algoCertId = algoCert[0][0].id;

    await queryInterface.bulkInsert('CertificationResource',
      [{
        resourceProviderId: providerId,
        resourceableType: 'FreeCodeCampCertification',
        resourceableId: webCertId,
        resourceTitle: 'Responsive Web Design',
        resourceDescription: 'The fundamentals of responsive web design',
        displayOrder: 0
      },
      {
        resourceProviderId: providerId,
        resourceableType: 'FreeCodeCampCertification',
        resourceableId: algoCertId,
        resourceTitle: 'Javascript Algorithms and Data Structures',
        resourceDescription: 'Algorithms and data structures in Javascript for backend code',
        displayOrder: 1
      }],
      {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CertificationResource', null, {});
  }
};
