'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('TopcoderCertification', 'learnedOutcomes', {
      type: Sequelize.ARRAY(Sequelize.DataTypes.TEXT),
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('TopcoderCertification', 'learnedOutcomes');
  }
};
