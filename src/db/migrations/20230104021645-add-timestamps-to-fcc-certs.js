'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('FreeCodeCampCertification', 'createdAt',
        {
          type: Sequelize.DATE,
        }),
      queryInterface.addColumn('FreeCodeCampCertification', 'updatedAt',
        {
          type: Sequelize.DATE
        }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('FreeCodeCampCertification', 'createdAt'),
      queryInterface.removeColumn('FreeCodeCampCertification', 'updatedAt'),
    ]);
  }
};
