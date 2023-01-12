'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CertificationEnrollments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      topcoderCertificationId: {
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'TopcoderCertification',
            schema: 'public'
          },
          key: 'id'
        },
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      userHandle: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM("enrolled", "disenrolled", "completed"),
        defaultValue: "enrolled",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      completedAt: {
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.dropTable('CertificationEnrollments'),
      queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CertificationEnrollment_status";'),
    ])
  }
};