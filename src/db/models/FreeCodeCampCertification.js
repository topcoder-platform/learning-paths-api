const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FreeCodeCampCertification extends Model {
    static associate(models) {
      this.hasOne(models.FccCourse, {
        as: 'course',
        foreignKey: 'certificationId'
      });

      this.hasMany(models.CertificationResource, {
        as: 'certificationResources',
        foreignKey: 'resourceableId',
        constraints: false,
        scope: {
          resourceableType: 'FreeCodeCampCertification',
        }
      });

      this.belongsTo(models.CertificationCategory, {
        as: 'certificationCategory',
        foreignKey: 'certificationCategoryId'
      });

      this.hasMany(models.FccCertificationProgress, {
        as: 'certificationProgresses',
        foreignKey: 'fccCertificationId',
      })
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
    description: {
      type: DataTypes.TEXT,
    },
    completionHours: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    state: {
      type: DataTypes.ENUM("active", "inactive", "coming-soon", "deprecated"),
      allowNull: false,
      defaultValue: "active"
    },
    certificationCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    certType: {
      type: DataTypes.ENUM("certification", "course-completion"),
      allowNull: false,
      defaultValue: "certification"
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    learnerLevel: {
      type: DataTypes.ENUM("Beginner", "Intermediate", "Expert", "All Levels"),
      allowNull: false,
      defaultValue: "Beginner"
    },
  }, {
    sequelize,
    tableName: 'FreeCodeCampCertification',
    modelName: 'FreeCodeCampCertification',
    schema: 'public',
    indexes: [
      {
        name: "FreeCodeCampCertification_fccId_key",
        unique: true,
        fields: [
          { name: "fccId" },
        ]
      },
      {
        name: "FreeCodeCampCertification_title_key",
        unique: true,
        fields: [
          { name: "title" },
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
