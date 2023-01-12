'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('FccCourses', 'learnerLevel',
        {
          type: Sequelize.ENUM("Beginner", "Intermediate", "Expert", "All Levels"),
          allowNull: true,
          defaultValue: 'Beginner'
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
      queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_FccCourses_learnerLevel";'),
    ]);
  }
};
