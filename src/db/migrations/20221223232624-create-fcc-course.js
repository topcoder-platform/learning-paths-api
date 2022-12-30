'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FccCourses', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      providerId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'ResourceProvider',
            schema: 'public'
          },
          key: 'id'
        },
      },
      key: {
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      certificationId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'FreeCodeCampCertification',
            schema: 'public'
          },
          key: 'id'
        },
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
      keyPoints: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      completionSuggestions: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      note: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('FccCourses');
  }
};