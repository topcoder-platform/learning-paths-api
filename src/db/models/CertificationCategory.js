const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CertificationCategory extends Model {
    static associate(models) {
      this.hasMany(models.TopcoderCertification, {
        as: 'TopcoderCertifications',
        foreignKey: 'certificationCategoryId'
      });

      this.hasMany(models.FreeCodeCampCertification, {
        as: 'FreeCodeCampCertifications',
        foreignKey: 'certificationCategoryId'
      })
    }
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

  return CertificationCategory;
};
