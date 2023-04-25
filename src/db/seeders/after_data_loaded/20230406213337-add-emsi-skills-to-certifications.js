'use strict';

/** @type {import('sequelize-cli').Migration} */

const db = require('../../models');
const CertsEMSIdata = require('./tca-certs-emsi-data');
const CoursesEMSIdata = require('./tca-courses-emsi-data');

module.exports = {
  async up(queryInterface, Sequelize) {
    // CERTS
    // TCA Web Dev cert
    const tcWebDev = await db.TopcoderCertification.findOne({
      where: { dashedName: 'web-development-fundamentals' }
    });

    await tcWebDev.update({
      emsiSkills: CertsEMSIdata.tcWebDev
    });


    // TCA DS cert
    const tcDataSci = await db.TopcoderCertification.findOne({
      where: { dashedName: 'data-science-fundamentals' }
    });

    await tcDataSci.update({
      emsiSkills: CertsEMSIdata.tcDataSci
    });

    // COURSES
    const courses = await db.FccCourse.findAll();
    for (const course of courses) {
      // if we have data - update
      if (CoursesEMSIdata[course.key]) {
        await course.update({
          emsiSkills: CoursesEMSIdata[course.key]
        });
      }
    }
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
    const tcDataSci = await db.TopcoderCertification.findOne({
      where: { dashedName: 'data-science-fundamentals' }
    });

    await tcDataSci.update({
      emsiSkills: null
    });

    // COURSES
    const courses = await db.FccCourse.findAll();
    for (const course of courses) {
      await course.update({
        emsiSkills: null
      });
    }
  }
};
