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
        foreignKey: 'certificationEnrollmentId',
        onDelete: 'CASCADE'
      });
    }
  }

  CertificationEnrollment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
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
    status: {
      type: DataTypes.ENUM("enrolled", "disenrolled", "completed"),
      defaultValue: "enrolled",
    },
    completedAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'CertificationEnrollment',
    tableName: 'CertificationEnrollments',
  });

  return CertificationEnrollment;
};