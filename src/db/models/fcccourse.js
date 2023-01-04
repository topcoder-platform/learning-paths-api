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

      this.belongsTo(models.FreeCodeCampCertification, {
        foreignKey: 'certificationId'
      });
    }
  }
  FccCourse.init({
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
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
      allowNull: false
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