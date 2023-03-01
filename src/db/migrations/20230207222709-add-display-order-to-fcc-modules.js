'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('FccModules', 'order', {
      type: Sequelize.DataTypes.INTEGER
    });
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeColumn('FccModules', 'order');
  }
};
