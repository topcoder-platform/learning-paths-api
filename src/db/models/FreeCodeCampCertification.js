const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FreeCodeCampCertification extends Model {
    static associate(models) {
      this.hasOne(models.CertificationResource, {
        as: 'FreeCodeCampCertification',
        foreignKey: 'id',
        constraints: false,
        scope: {
          resourceableType: 'FreeCodeCampCertification',
        }
      });
    }
  }

  FreeCodeCampCertification.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    fccId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    key: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    providerCertificationId: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    certification: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    completionHours: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    state: {
      type: DataTypes.ENUM("active", "inactive", "coming_soon", "deprecated"),
      allowNull: false,
      defaultValue: "active"
    },
    certificationCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'CertificationCategory',
        key: 'id'
      }
    },
    certType: {
      type: DataTypes.ENUM("certification", "course-completion"),
      allowNull: false,
      defaultValue: "certification"
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'FreeCodeCampCertification',
    modelName: 'FreeCodeCampCertification',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "FreeCodeCampCertification_fccId_key",
        unique: true,
        fields: [
          { name: "fccId" },
        ]
      },
      {
        name: "FreeCodeCampCertification_key_key",
        unique: true,
        fields: [
          { name: "key" },
        ]
      },
      {
        name: "FreeCodeCampCertification_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  return FreeCodeCampCertification;
};
