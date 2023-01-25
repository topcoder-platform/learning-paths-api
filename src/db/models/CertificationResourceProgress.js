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

      this.belongsTo(models.FccCertificationProgress, {
        as: 'fccCertificationProgress',
        foreignKey: 'resourceProgressId',
        constraints: false,
      });
    }
  }
  CertificationResourceProgress.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    certificationEnrollmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    certificationResourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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