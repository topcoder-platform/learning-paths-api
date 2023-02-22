'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('FccCourses', 'introCopy', {
      type: Sequelize.ARRAY(Sequelize.TEXT)
    });
    await queryInterface.changeColumn('FccCourses', 'keyPoints', {
      type: Sequelize.ARRAY(Sequelize.TEXT)
    });
    await queryInterface.changeColumn('FccCourses', 'completionSuggestions', {
      type: Sequelize.ARRAY(Sequelize.TEXT)
    });

    await queryInterface.changeColumn('TopcoderCertification', 'learningOutcomes', {
      type: Sequelize.ARRAY(Sequelize.TEXT)
    });
    await queryInterface.changeColumn('TopcoderCertification', 'prerequisites', {
      type: Sequelize.ARRAY(Sequelize.TEXT)
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('FccCourses', 'introCopy', {
      type: Sequelize.ARRAY(Sequelize.STRING)
    });
    await queryInterface.changeColumn('FccCourses', 'keyPoints', {
      type: Sequelize.ARRAY(Sequelize.STRING)
    });
    await queryInterface.changeColumn('FccCourses', 'completionSuggestions', {
      type: Sequelize.ARRAY(Sequelize.STRING)
    });

    await queryInterface.changeColumn('TopcoderCertification', 'learningOutcomes', {
      type: Sequelize.ARRAY(Sequelize.STRING)
    });
    await queryInterface.changeColumn('TopcoderCertification', 'prerequisites', {
      type: Sequelize.ARRAY(Sequelize.STRING)
    });
  }
};
