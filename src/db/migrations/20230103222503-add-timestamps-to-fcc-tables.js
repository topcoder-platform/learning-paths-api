'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('CertificationCategory', 'createdAt',
        {
          type: Sequelize.DATE,
        }),
      queryInterface.addColumn('CertificationCategory', 'updatedAt',
        {
          type: Sequelize.DATE
        }),
      queryInterface.addColumn('CertificationResource', 'createdAt',
        {
          type: Sequelize.DATE,
        }),
      queryInterface.addColumn('CertificationResource', 'updatedAt',
        {
          type: Sequelize.DATE
        }),
      queryInterface.addColumn('ResourceProvider', 'createdAt',
        {
          type: Sequelize.DATE,
        }),
      queryInterface.addColumn('ResourceProvider', 'updatedAt',
        {
          type: Sequelize.DATE
        }),
      queryInterface.addColumn('TopcoderCertification', 'createdAt',
        {
          type: Sequelize.DATE,
        }),
      queryInterface.addColumn('TopcoderCertification', 'updatedAt',
        {
          type: Sequelize.DATE
        }),
    ])
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('CertificationCategory', 'createdAt'),
      queryInterface.removeColumn('CertificationCategory', 'updatedAt'),
      queryInterface.removeColumn('CertificationResource', 'createdAt'),
      queryInterface.removeColumn('CertificationResource', 'updatedAt'),
      queryInterface.removeColumn('ResourceProvider', 'createdAt'),
      queryInterface.removeColumn('ResourceProvider', 'updatedAt'),
      queryInterface.removeColumn('TopcoderCertification', 'createdAt'),
      queryInterface.removeColumn('TopcoderCertification', 'updatedAt'),
    ])
  }
};
