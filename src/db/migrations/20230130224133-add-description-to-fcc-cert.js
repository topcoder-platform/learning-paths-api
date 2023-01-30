'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('FreeCodeCampCertification', 'description', {
      type: Sequelize.TEXT,
    });
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeColumn('FreeCodeCampCertification', 'description');
  }
};
