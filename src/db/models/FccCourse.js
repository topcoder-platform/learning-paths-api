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
        foreignKey: 'certificationId',
        as: 'freeCodeCampCertification'
      });

      this.hasMany(models.FccCertificationProgress, {
        foreignKey: 'fccCourseId',
        as: 'certificationProgresses'
      })
    }

    /**
     * Gets the complete set of lessons from all of the modules
     * in this course.
     * 
     * @returns array of FccLessons
     */
    async getLessons() {
      let lessons = [];

      const modules = await this.getModules();
      for (const module of modules) {
        const moduleLessons = await module.getLessons();
        lessons.push(...moduleLessons)
      }

      return lessons;
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
    introCopy: DataTypes.ARRAY(DataTypes.TEXT),
    keyPoints: DataTypes.ARRAY(DataTypes.TEXT),
    completionSuggestions: DataTypes.ARRAY(DataTypes.TEXT),
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