'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('CertificationResource', 'topcoderCertificationId', {
      type: Sequelize.DataTypes.INTEGER
    });
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeColumn('CertificationResource', 'topcoderCertificationId')
  }
};
