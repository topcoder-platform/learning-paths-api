const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('DataVersion', {
    version: {
      type: DataTypes.DATE,
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'DataVersion',
    schema: process.env.TCA_PG_SCHEMA,
    timestamps: false,
    indexes: [
      {
        name: "DataVersion_pkey",
        unique: true,
        fields: [
          { name: "version" },
        ]
      },
    ]
  });
};
