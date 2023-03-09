'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // WEB
    await queryInterface.sequelize.query(
      `UPDATE "CertificationResource" SET "displayOrder" = 0 WHERE "resourceTitle" = 'Responsive Web Design Certification';`
    );
    await queryInterface.sequelize.query(
      `UPDATE "CertificationResource" SET "displayOrder" = 1 WHERE "resourceTitle" = 'JavaScript Algorithms and Data Structures Certification';`
    );
    await queryInterface.sequelize.query(
      `UPDATE "CertificationResource" SET "displayOrder" = 2 WHERE "resourceTitle" = 'Front End Development Libraries Certification';`
    );
    await queryInterface.sequelize.query(
      `UPDATE "CertificationResource" SET "displayOrder" = 3 WHERE "resourceTitle" = 'Back End Development and APIs';`
    );

    // DS
    await queryInterface.sequelize.query(
      `UPDATE "CertificationResource" SET "displayOrder" = 0 WHERE "resourceTitle" = 'Data Visualization';`
    );
    await queryInterface.sequelize.query(
      `UPDATE "CertificationResource" SET "displayOrder" = 1 WHERE "resourceTitle" = 'Scientific Computing with Python';`
    );
    await queryInterface.sequelize.query(
      `UPDATE "CertificationResource" SET "displayOrder" = 2 WHERE "resourceTitle" = 'Data Analysis with Python';`
    );
    await queryInterface.sequelize.query(
      `UPDATE "CertificationResource" SET "displayOrder" = 3 WHERE "resourceTitle" = 'Machine Learning with Python';`
    );
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
