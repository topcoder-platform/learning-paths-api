'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.changeColumn('CertificationEnrollments', 'userId', {
      type: Sequelize.STRING
    })
  },

  async down(queryInterface, Sequelize) {
    queryInterface.changeColumn('CertificationEnrollments', 'userId', {
      type: Sequelize.INTEGER
    })
  }
};
