'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // remove emsiSkills column
    await queryInterface.removeColumn('TopcoderCertification', 'emsiSkills');
    await queryInterface.removeColumn('FccCourses', 'emsiSkills');

    // remove old skills column as it can't be casted to uuid[]
    await queryInterface.removeColumn('TopcoderCertification', 'skills');
    await queryInterface.removeColumn('FccCourses', 'skills');

    // add again skills column, this time with type uuid[]
    await queryInterface.addColumn('TopcoderCertification', 'skills', {
      type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.UUID)
    });
    await queryInterface.addColumn('FccCourses', 'skills', {
      type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.UUID)
    });
  },

  async down(queryInterface, Sequelize) {
    // add back emsiSkills column
    await queryInterface.addColumn('TopcoderCertification', 'emsiSkills', {
      type: Sequelize.DataTypes.JSONB
    });
    await queryInterface.addColumn('FccCourses', 'emsiSkills', {
      type: Sequelize.DataTypes.JSONB
    });
    // add back skills column
    await queryInterface.addColumn('TopcoderCertification', 'skills', {
      type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.STRING)
    });
    await queryInterface.addColumn('FccCourses', 'skills', {
      type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.STRING)
    });
  }
};
