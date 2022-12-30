'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FccLesson extends Model {
    static associate(models) {
      this.belongsTo(models.FccModule, {
        foreignKey: 'fccModuleId'
      });
    }
  }
  FccLesson.init({
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    fccModuleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dashedName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAssessment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'FccLesson',
    tableName: 'FccLessons'
  });
  return FccLesson;
};