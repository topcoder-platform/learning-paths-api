'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('TopcoderCertification', 'estimatedCompletionTime')
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('TopcoderCertification', 'estimatedCompletionTime', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    })
  }
};
