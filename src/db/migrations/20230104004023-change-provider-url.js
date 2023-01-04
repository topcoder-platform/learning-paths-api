'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.renameColumn('ResourceProvider', 'attributionUrl', 'url')
  },

  async down(queryInterface, Sequelize) {
    queryInterface.renameColumn('ResourceProvider', 'url', 'attributionUrl')
  }
};
