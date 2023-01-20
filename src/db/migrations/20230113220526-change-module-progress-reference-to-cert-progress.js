'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('FccModuleProgresses', 'fccCourseProgressId'),
      queryInterface.addColumn('FccModuleProgresses', 'fccCertificationProgressId', {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'FccCertificationProgresses',
            schema: 'public'
          },
          key: 'id'
        },
      })
    ])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('FccModuleProgresses', 'fccCertificationProgressId')
  }
};
