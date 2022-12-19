const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TopcoderCertification extends Model {
    static associate(models) {
      this.hasMany(models.CertificationResource, {
        as: 'CertificationResource',
        foreignKey: 'topcoderCertificationId'
      });
    }
  }

  TopcoderCertification.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    estimatedCompletionTime: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "coming_soon", "deprecated"),
      allowNull: false,
      defaultValue: "active"
    },
    sequentialCourses: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    learnerLevel: {
      type: DataTypes.ENUM("Beginner", "Intermediate", "Expert", "All Levels"),
      allowNull: false
    },
    version: {
      type: DataTypes.DATE,
      allowNull: false
    },
    certificationCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'CertificationCategory',
        key: 'id'
      }
    },
    stripeProductId: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TopcoderCertification',
    modelName: 'TopcoderCertification',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "TopcoderCertification_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "TopcoderCertification_title_key",
        unique: true,
        fields: [
          { name: "title" },
        ]
      },
    ]
  });

  return TopcoderCertification
};
