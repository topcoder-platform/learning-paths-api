'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('TopcoderCertification', 'learningOutcomes',
        {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true
        }),
      queryInterface.addColumn('TopcoderCertification', 'prerequisites',
        {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true
        }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('TopcoderCertification', 'learningOutcomes'),
      queryInterface.removeColumn('TopcoderCertification', 'prerequisites'),
    ]);
  }
};
