'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('TopcoderCertification', 'dashedName', {
        type: Sequelize.STRING,
      }),
      queryInterface.addColumn('TopcoderCertification', 'introText', {
        type: Sequelize.TEXT,
      })
    ])
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('TopcoderCertification', 'dashedName'),
      queryInterface.removeColumn('TopcoderCertification', 'introText')
    ])
  }
};
