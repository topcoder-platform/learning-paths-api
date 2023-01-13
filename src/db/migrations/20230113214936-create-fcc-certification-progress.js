'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FccCertificationProgresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fccCertificationId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'FreeCodeCampCertification',
            schema: 'public'
          },
          key: 'id'
        },
      },
      certProgressDynamoUuid: {
        type: Sequelize.UUID,
      },
      fccCourseId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'FccCourses',
            schema: 'public'
          },
          key: 'id'
        },
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
    return Promise.all([
      queryInterface.dropTable('FccCertificationProgresses'),
      queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_FccCertificationProgresses_status";'),
    ])
  }
};