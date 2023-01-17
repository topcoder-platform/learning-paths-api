'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
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
          type: Sequelize.STRING,
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
      }, { transaction });

      await queryInterface.addIndex(
        'CertificationEnrollments',
        ['topcoderCertificationId', 'userId'],
        { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeIndex('CertificationEnrollments', ['topcoderCertificaitonId', 'userId']),
      queryInterface.dropTable('CertificationEnrollments'),
      queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CertificationEnrollment_status";'),
    ])
  }
};