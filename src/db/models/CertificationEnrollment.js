'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CertificationEnrollment extends Model {
    static associate(models) {
      this.belongsTo(models.TopcoderCertification, {
        as: 'topcoderCertification',
        foreignKey: 'topcoderCertificationId'
      });

      this.hasMany(models.CertificationResourceProgress, {
        as: 'resourceProgresses',
        foreignKey: 'certificationEnrollmentId'
      });
    }
  }
  CertificationEnrollment.init({
    topcoderCertificationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userHandle: {
      type: DataTypes.STRING
    },
  }, {
    sequelize,
    modelName: 'CertificationEnrollment',
  });

  return CertificationEnrollment;
};