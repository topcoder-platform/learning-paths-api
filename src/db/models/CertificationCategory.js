const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CertificationCategory extends Model {

  }

  CertificationCategory.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    category: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    track: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'CertificationCategory',
    modelName: 'CertificationCategory',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "CertificationCategory_category_key",
        unique: true,
        fields: [
          { name: "category" },
        ]
      },
      {
        name: "CertificationCategory_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
