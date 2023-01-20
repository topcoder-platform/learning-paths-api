'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeConstraint(
        'CertificationResourceProgresses',
        'CertificationResourceProgresses_certificationEnrollmentId_fkey',
        { transaction })

      await queryInterface.addConstraint(
        'CertificationResourceProgresses',
        {
          fields: ['certificationEnrollmentId'],
          type: 'foreign key',
          name: 'CertificationResourceProgresses_certificationEnrollmentId_fkey',
          references: {
            table: 'CertificationEnrollments',
            field: 'id'
          },
          onDelete: 'cascade',
          onUpdate: 'cascade',
          transaction: transaction
        }
      )
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeConstraint(
      'CertificationResourceProgresses',
      'CertificationResourceProgresses_certificationEnrollmentId_fkey')
  }
};
