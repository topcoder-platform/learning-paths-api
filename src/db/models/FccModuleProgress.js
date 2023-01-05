'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FccModuleProgress extends Model {
    static associate(models) {
      this.belongsTo(models.FccCourseProgress, {
        foreignKey: 'fccCourseProgressId'
      });

      this.hasMany(models.FccCompletedLesson, {
        as: 'completedLessons',
        foreignKey: 'fccModuleProgressId'
      });
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
    fccCourseProgressId: {
      type: DataTypes.INTEGER,
      references: {
        model: {
          tableName: 'FccCourseProgress',
          schema: 'public'
        },
        key: 'id'
      },
    },
    moduleStatus: {
      type: DataTypes.ENUM("in-progress", "completed"),
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
    completedDate: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'FccModuleProgress',
  });
  return FccModuleProgress;
};