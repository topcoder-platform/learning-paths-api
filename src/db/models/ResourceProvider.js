const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
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
    attributionUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ResourceProvider',
    schema: 'public',
    timestamps: false,
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
