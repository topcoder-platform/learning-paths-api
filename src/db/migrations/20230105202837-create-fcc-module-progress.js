'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FccModuleProgresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fccCourseProgressId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'FccCourseProgresses',
            schema: 'public'
          },
          key: 'id'
        },
      },
      moduleStatus: {
        type: Sequelize.ENUM("not-started", "in-progress", "completed"),
        defaultValue: "not-started",
      },
      lessonCount: {
        type: Sequelize.INTEGER
      },
      isAssessment: {
        type: Sequelize.BOOLEAN
      },
      startDate: {
        type: Sequelize.DATE
      },
      lastInteractionDate: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('FccModuleProgresses');
  }
};