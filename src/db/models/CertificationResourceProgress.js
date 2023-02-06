'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CertificationResourceProgress extends Model {
    static associate(models) {
      this.belongsTo(models.CertificationEnrollment, {
        as: 'certificationEnrollment',
        foreignKey: 'certificationEnrollmentId'
      });

      this.belongsTo(models.CertificationResource, {
        as: 'certificationResource',
        foreignKey: 'certificationResourceId',
      });

      this.belongsTo(models.FccCertificationProgress, {
        as: 'fccCertificationProgress',
        foreignKey: 'resourceProgressId',
        constraints: false,
      });
    }
  }

  CertificationResourceProgress.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    certificationEnrollmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: 'CertificationEnrollments',
          schema: 'public'
        },
        key: 'id'
      },
    },
    certificationResourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: 'CertificationResource',
          schema: 'public'
        },
        key: 'id'
      },
    },
    status: {
      type: DataTypes.ENUM("not-started", "in-progress", "completed"),
      defaultValue: "not-started",
    },
    resourceProgressId: DataTypes.INTEGER,
    resourceProgressType: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CertificationResourceProgress',
    tableName: 'CertificationResourceProgresses',
    schema: 'public',
    indexes: [
      {
        name: "CertificationResourceProgress_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  return CertificationResourceProgress;
};