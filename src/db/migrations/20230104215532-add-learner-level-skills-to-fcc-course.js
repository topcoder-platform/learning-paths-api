'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('FccCourses', 'learnerLevel',
        {
          type: Sequelize.ENUM("Beginner", "Intermediate", "Expert", "All Levels"),
          allowNull: true
        }),
      queryInterface.addColumn('FccCourses', 'skills',
        {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true
        }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('FccCourses', 'learnerLevel'),
      queryInterface.removeColumn('FccCourses', 'skills'),
    ]);
  }
};
