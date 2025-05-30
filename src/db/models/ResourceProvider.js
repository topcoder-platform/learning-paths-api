const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ResourceProvider', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attributionStatement: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ResourceProvider',
    modelName: 'ResourceProvider',
    schema: process.env.TCA_PG_SCHEMA,
    indexes: [
      {
        name: "ResourceProvider_name_key",
        unique: true,
        fields: [
          { name: "name" },
        ]
      },
      {
        name: "ResourceProvider_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
