'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CertificationEnrollments', 'completionUuid', {
      type: Sequelize.DataTypes.STRING
    });

    await queryInterface.addIndex('CertificationEnrollments', ['completionUuid'], {
      name: 'CertificationEnrollments_completionUuid',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex('CertificationEnrollments', 'CertificationEnrollments_completionUuid', { transaction });
      await queryInterface.removeColumn('CertificationEnrollments', 'completionUuid', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
