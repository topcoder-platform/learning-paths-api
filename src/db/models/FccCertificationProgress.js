'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FccCertificationProgress extends Model {
    static associate(models) {
      this.hasMany(models.FccModuleProgress, {
        as: 'moduleProgresses',
        foreignKey: 'fccCertificationProgressId'
      });

      this.belongsTo(models.FreeCodeCampCertification, {
        foreignKey: 'fccCertificationId'
      });

      this.belongsTo(models.FccCourse, {
        foreignKey: 'fccCourseId'
      });

      this.hasOne(models.CertificationResourceProgress, {
        as: 'FccCertificationProgress',
        foreignKey: 'id',
        constraints: false,
        scope: {
          resourceableType: 'FccCertificationProgress',
        }
      });
    }
  }
  FccCertificationProgress.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    fccCertificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    certProgressDynamoUuid: {
      type: DataTypes.UUID,
    },
    fccCourseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    certification: DataTypes.STRING,
    certificationId: DataTypes.STRING,
    certificationTitle: DataTypes.STRING,
    certificationTrackType: DataTypes.STRING,
    certType: DataTypes.STRING,
    courseKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("in-progress", "completed"),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    lastInteractionDate: DataTypes.DATE,
    completedDate: DataTypes.DATE,
    academicHonestyPolicyAcceptedAt: DataTypes.DATE,
    currentLesson: DataTypes.STRING,
    certificationImageUrl: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'FccCertificationProgress',
    tableName: 'FccCertificationProgresses',
  });
  return FccCertificationProgress;
};