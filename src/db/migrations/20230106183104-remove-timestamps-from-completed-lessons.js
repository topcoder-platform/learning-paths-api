'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('FccCompletedLessons', 'createdAt'),
      queryInterface.removeColumn('FccCompletedLessons', 'updatedAt'),
    ])
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('FccCompletedLessons', 'createdAt',
        {
          type: Sequelize.DATE,
        }),
      queryInterface.addColumn('FccCompletedLessons', 'updatedAt',
        {
          type: Sequelize.DATE
        }),
    ]);
  }
};
