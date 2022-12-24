'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FccModules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fccCourseId: {
        type: Sequelize.UUID,
        references: {
          model: {
            tableName: 'FccCourses',
            schema: 'public'
          },
          key: 'id'
        }
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dashedName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      estimatedCompletionTimeValue: {
        type: Sequelize.INTEGER
      },
      estimatedCompletionTimeUnits: {
        type: Sequelize.STRING
      },
      introCopy: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      isAssessment: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable('FccModules');
  }
};