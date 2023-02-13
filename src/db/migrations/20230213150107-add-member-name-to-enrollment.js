'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('CertificationEnrollments', 'userName', {
      type: Sequelize.DataTypes.STRING
    });
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeColumn('CertificationEnrollments', 'userName');
  }
};
