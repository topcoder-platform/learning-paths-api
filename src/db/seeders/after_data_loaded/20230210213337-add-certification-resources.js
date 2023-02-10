'use strict';

/** @type {import('sequelize-cli').Migration} */

const db = require('../../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    var Op = Sequelize.Op;

    // create resources for Web Development Fundamentals certification
    const tcWebDev = await db.TopcoderCertification.findOne({
      where: { dashedName: 'web-development-certification' }
    });

    let fccCertNames = [
      'responsive-web-design',
      'javascript-algorithms-and-data-structures',
      'back-end-development-and-apis',
      'front-end-development-libraries'
    ];
    const fccWebDevCerts = await db.FreeCodeCampCertification.findAll({
      where: {
        certification: {
          [Op.in]: fccCertNames
        }
      }
    });

    let displayOrder = 0;
    for (const cert of fccWebDevCerts) {
      const certResource = {
        resourceProviderId: cert.resourceProviderId,
        resourceableId: cert.id,
        resourceableType: 'FreeCodeCampCertification',
        resourceTitle: cert.title,
        resourceDescription: 'A freeCodeCamp.org course-completion certificate',
        displayOrder: displayOrder++,
        completionOrder: 0
      }
      const resource = await tcWebDev.createCertificationResource(certResource);
      console.log('WebDev resource', resource);
    }

    // create resources for Data Science Fundamentals certification
    const tcDataSci = await await db.TopcoderCertification.findOne({
      where: { dashedName: 'data-science-certification' }
    });

    fccCertNames = [
      'machine-learning-with-python',
      'scientific-computing-with-python',
      'data-analysis-with-python',
      'data-visualization'
    ];
    const fccDSCerts = await db.FreeCodeCampCertification.findAll({
      where: {
        certification: {
          [Op.in]: fccCertNames
        }
      }
    });

    displayOrder = 0;
    for (const cert of fccDSCerts) {
      const certResource = {
        resourceProviderId: cert.resourceProviderId,
        resourceableId: cert.id,
        resourceableType: 'FreeCodeCampCertification',
        resourceTitle: cert.title,
        resourceDescription: 'A freeCodeCamp.org course-completion certificate',
        displayOrder: displayOrder++,
        completionOrder: 0
      }
      const resource = await tcDataSci.createCertificationResource(certResource);
      console.log('DataSci resource', resource);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CertificationResource', null, {});
  }
};
