'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('TopcoderCertification', 'emsiSkills', {
      type: Sequelize.DataTypes.JSONB
    });
    await queryInterface.addColumn('FccCourses', 'emsiSkills', {
      type: Sequelize.DataTypes.JSONB
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('TopcoderCertification', 'emsiSkills');
    await queryInterface.removeColumn('FccCourses', 'emsiSkills');
  }
};
