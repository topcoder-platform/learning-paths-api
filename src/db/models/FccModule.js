'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FccModule extends Model {
    static associate(models) {
      this.belongsTo(models.FccCourse, {
        foreignKey: 'fccCourseId'
      });

      this.hasMany(models.FccLesson, {
        as: 'lessons',
        foreignKey: 'fccModuleId'
      });
    }
  }
  FccModule.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    fccCourseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dashedName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estimatedCompletionTimeValue: DataTypes.INTEGER,
    estimatedCompletionTimeUnits: DataTypes.STRING,
    introCopy: DataTypes.ARRAY(DataTypes.STRING),
    isAssessment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['key']
      }
    ],
    sequelize,
    modelName: 'FccModule',
    tableName: 'FccModules'
  });
  return FccModule;
};