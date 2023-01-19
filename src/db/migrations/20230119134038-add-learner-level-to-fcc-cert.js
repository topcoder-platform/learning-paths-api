'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('FreeCodeCampCertification', 'learnerLevel',
        {
          type: Sequelize.ENUM("Beginner", "Intermediate", "Expert", "All Levels"),
          allowNull: true,
          defaultValue: 'Beginner'
        }),
    ]);
  },

  async down (queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('FreeCodeCampCertification', 'learnerLevel'),
      queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_FccCourses_learnerLevel";'),
    ]);
  }
};
