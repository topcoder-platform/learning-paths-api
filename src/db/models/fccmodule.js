'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FccModule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  FccModule.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    fccCourseId: {
      type: DataTypes.UUID,
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
  });
  return FccModule;
};