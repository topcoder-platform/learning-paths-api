'use strict';

/** @type {import('sequelize-cli').Migration} */

const db = require('../../models');
const CertsSkillsData = require('./tca-certs-skills-data');
const CoursesSkillsData = require('./tca-courses-skills-data');

module.exports = {
  async up(queryInterface, Sequelize) {
    // CERTS
    // TCA Web Dev cert
    const tcWebDev = await db.TopcoderCertification.findOne({
      where: { dashedName: 'web-development-fundamentals' }
    });

    await tcWebDev.update({
      skills: CertsSkillsData.tcWebDev
    });


    // TCA DS cert
    const tcDataSci = await db.TopcoderCertification.findOne({
      where: { dashedName: 'data-science-fundamentals' }
    });

    await tcDataSci.update({
      skills: CertsSkillsData.tcDataSci
    });

    // COURSES
    const courses = await db.FccCourse.findAll();
    for (const course of courses) {
      // if we have data - update
      if (CoursesSkillsData[course.key]) {
        await course.update({
          skills: CoursesSkillsData[course.key]
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
      skills: null
    });


    // TCA DS cert
    const tcDataSci = await db.TopcoderCertification.findOne({
      where: { dashedName: 'data-science-fundamentals' }
    });

    await tcDataSci.update({
      skills: null
    });

    // COURSES
    const courses = await db.FccCourse.findAll();
    for (const course of courses) {
      await course.update({
        skills: null
      });
    }
  }
};
