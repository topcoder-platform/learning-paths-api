'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FccCourse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  FccCourse.init({
    id: DataTypes.UUID,
    providerId: DataTypes.INTEGER,
    key: DataTypes.STRING,
    title: DataTypes.STRING,
    certificationId: DataTypes.INTEGER,
    certificationUuid: DataTypes.UUID,
    certification: DataTypes.STRING,
    estimatedCompletionTimeValue: DataTypes.INTEGER,
    estimatedCompletionTimeUnits: DataTypes.STRING,
    introCopy: DataTypes.ARRAY(DataTypes.STRING),
    keyPoints: DataTypes.ARRAY(DataTypes.STRING),
    completionSuggestions: DataTypes.ARRAY(DataTypes.STRING),
    note: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'FccCourse',
  });
  return FccCourse;
};