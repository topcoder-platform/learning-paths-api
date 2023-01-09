'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FccCompletedLessons', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      fccModuleProgressId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: {
            tableName: 'FccModuleProgresses',
            schema: 'public'
          },
          key: 'id'
        },
      },
      dashedName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      completedDate: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('FccCompletedLessons');
  }
};