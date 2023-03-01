'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('FreeCodeCampCertification', 'resourceProviderId', {
      type: Sequelize.DataTypes.INTEGER,
      references: {
        model: 'ResourceProvider',
        key: 'id'
      }
    })
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeColumn('FreeCodeCampCertification', 'resourceProviderId')
  }
};
