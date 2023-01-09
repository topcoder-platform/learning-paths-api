'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FccCourseProgresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fccProgressId: {
        type: Sequelize.UUID,

      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      certification: {
        type: Sequelize.STRING
      },
      certificationId: {
        type: Sequelize.STRING
      },
      certificationTitle: {
        type: Sequelize.STRING
      },
      certificationTrackType: {
        type: Sequelize.STRING
      },
      certType: {
        type: Sequelize.STRING
      },
      courseKey: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fccCourseId: {
        type: Sequelize.UUID,
        allowNull: false,
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
      status: {
        type: Sequelize.ENUM("in-progress", "completed"),
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      lastInteractionDate: {
        type: Sequelize.DATE
      },
      completedDate: {
        type: Sequelize.DATE
      },
      academicHonestyPolicyAcceptedAt: {
        type: Sequelize.DATE
      },
      currentLesson: {
        type: Sequelize.STRING
      },
      certificationImageUrl: {
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
    await queryInterface.dropTable('FccCourseProgresses');
  }
};