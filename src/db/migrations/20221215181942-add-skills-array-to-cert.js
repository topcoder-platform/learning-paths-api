'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('TopcoderCertification', 'skills', {
      type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.STRING)
    });
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeColumn('TopcoderCertification', 'skills')
  }
};
