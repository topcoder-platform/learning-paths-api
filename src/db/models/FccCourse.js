'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FccCourse extends Model {

    static associate(models) {
      this.hasMany(models.FccModule, {
        as: 'modules',
        foreignKey: 'fccCourseId'
      });

      this.belongsTo(models.ResourceProvider, {
        foreignKey: 'providerId',
        as: 'resourceProvider'
      });

      this.belongsTo(models.FreeCodeCampCertification, {
<<<<<<< HEAD
        foreignKey: 'certificationId',
        as: 'freeCodeCampCertification'
=======
        as: 'fccCertification',
        foreignKey: 'certificationId'
>>>>>>> 6506d70 (Fix to completeLesson via Mongo trigger for missing association)
      });

      this.hasMany(models.FccCertificationProgress, {
        foreignKey: 'fccCourseId',
        as: 'certificationProgresses'
      })
    }

  }

  FccCourse.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    fccCourseUuid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    providerId: DataTypes.INTEGER,
    key: DataTypes.STRING,
    title: DataTypes.STRING,
    certificationId: DataTypes.INTEGER,
    estimatedCompletionTimeValue: DataTypes.INTEGER,
    estimatedCompletionTimeUnits: DataTypes.STRING,
    introCopy: DataTypes.ARRAY(DataTypes.STRING),
    keyPoints: DataTypes.ARRAY(DataTypes.STRING),
    completionSuggestions: DataTypes.ARRAY(DataTypes.STRING),
    note: DataTypes.STRING,
    learnerLevel: {
      type: DataTypes.ENUM("Beginner", "Intermediate", "Expert", "All Levels"),
      allowNull: false,
      defaultValue: "Beginner",
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'FccCourse',
    tableName: 'FccCourses'
  });

  return FccCourse;
};