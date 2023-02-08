'use strict';
const {
  Model
} = require('sequelize');

const { progressStatuses } = require('../../common/constants');

module.exports = (sequelize, DataTypes) => {
  class FccModuleProgress extends Model {

    static associate(models) {
      this.belongsTo(models.FccCertificationProgress, {
        as: 'certificationProgress',
        foreignKey: 'fccCertificationProgressId'
      });

      this.hasMany(models.FccCompletedLesson, {
        as: 'completedLessons',
        foreignKey: 'fccModuleProgressId',
        onDelete: 'CASCADE'
      });
    }

    isCompleted() {
      return this.moduleStatus == progressStatuses.completed
    }

    /**
     * Checks if this module progress is an assessment and has 
     * been completed.
     * 
     * @returns true if module is an assessment and is completed, otherwise false
     */
    isCompletedAssessment() {
      return this.isAssessment && this.isCompleted()
    }
  }

  FccModuleProgress.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fccCertificationProgressId: {
      type: DataTypes.INTEGER,
      references: {
        model: {
          tableName: 'FccCertificationProgresses',
          schema: 'public'
        },
        key: 'id'
      },
    },
    moduleStatus: {
      type: DataTypes.ENUM("not-started", "in-progress", "completed"),
      allowNull: false,
      defaultValue: "in-progress",
    },
    lessonCount: DataTypes.INTEGER,
    isAssessment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    startDate: DataTypes.DATE,
    lastInteractionDate: DataTypes.DATE,
    completedDate: DataTypes.DATE,
    completedLessonCount: DataTypes.VIRTUAL,
    completedPercentage: DataTypes.VIRTUAL,
  }, {
    sequelize,
    modelName: 'FccModuleProgress',
    tableName: 'FccModuleProgresses',
  });
  return FccModuleProgress;
};