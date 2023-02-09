'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FccCompletedLesson extends Model {
    static associate(models) {
      this.belongsTo(models.FccModuleProgress, {
        foreignKey: 'fccModuleProgressId'
      });
    }
  }
  FccCompletedLesson.init({
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    fccModuleProgressId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    dashedName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    completedDate: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'FccCompletedLesson',
    tableName: 'FccCompletedLessons',
    timestamps: false,
  });

  return FccCompletedLesson;
};