'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CertificationResourceProgresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      certificationEnrollmentId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'CertificationEnrollments',
            schema: 'public'
          },
          key: 'id'
        },
      },
      certificationResourceId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'CertificationResource',
            schema: 'public'
          },
          key: 'id'
        },
      },
      status: {
        type: Sequelize.ENUM("not-started", "in-progress", "completed"),
        defaultValue: "not-started",
      },
      resourceProgressId: {
        type: Sequelize.INTEGER
      },
      resourceProgressType: {
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
      queryInterface.dropTable('CertificationResourceProgresses'),
      queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CertificationResourceProgresses_status";'),
    ])
  }
};