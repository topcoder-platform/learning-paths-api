'use strict';

/** @type {import('sequelize-cli').Migration} */

const db = require('../../models');
const EMSIdata = require('./tca-certs-emsi-data');

module.exports = {
  async up(queryInterface, Sequelize) {
    // TCA Web Dev cert
    const tcWebDev = await db.TopcoderCertification.findOne({
      where: { dashedName: 'web-development-fundamentals' }
    });

    await tcWebDev.update({
      emsiSkills: EMSIdata.tcWebDev
    });


    // TCA DS cert
    const tcDataSci = await await db.TopcoderCertification.findOne({
      where: { dashedName: 'data-science-fundamentals' }
    });

    await tcDataSci.update({
      emsiSkills: EMSIdata.tcDataSci
    });
  },

  async down(queryInterface, Sequelize) {
    // TCA Web Dev cert
    const tcWebDev = await db.TopcoderCertification.findOne({
      where: { dashedName: 'web-development-fundamentals' }
    });

    await tcWebDev.update({
      emsiSkills: null
    });


    // TCA DS cert
    const tcDataSci = await await db.TopcoderCertification.findOne({
      where: { dashedName: 'data-science-fundamentals' }
    });

    await tcDataSci.update({
      emsiSkills: null
    });
  }
};
