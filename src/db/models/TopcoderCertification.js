const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TopcoderCertification extends Model {
    static associate(models) {
      this.hasMany(models.CertificationResource, {
        as: 'certificationResources',
        foreignKey: 'topcoderCertificationId'
      });

      this.belongsToMany(models.ResourceProvider, {
        through: models.CertificationResource,
        as: 'resourceProviders',
        foreignKey: 'topcoderCertificationId',
        otherKey: 'resourceProviderId'
      })

      this.belongsTo(models.CertificationCategory, {
        as: 'certificationCategory',
        foreignKey: 'certificationCategoryId'
      });

      this.hasMany(models.CertificationEnrollment, {
        as: 'certificationEnrollments',
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
    dashedName: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    introText: {
      type: DataTypes.TEXT,
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
      allowNull: false,
      defaultValue: "Beginner"
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
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    learningOutcomes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    prerequisites: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    coursesCount: {
      type: DataTypes.VIRTUAL,
    },
    providers: {
      type: DataTypes.VIRTUAL,
    }
  }, {
    sequelize,
    tableName: 'TopcoderCertification',
    modelName: 'TopcoderCertification',
    schema: 'public',
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

  // add computed (virtual) attributes
  TopcoderCertification.addHook("afterFind", findResult => {
    if (!Array.isArray(findResult)) findResult = [findResult];

    for (const instance of findResult) {
      // TODO: we are checking that the certification contains resources 
      // and resource providers, but in reality a certification without 
      // any curriculum resources isn't viable. Need to handle this case 
      // in a better way.
      if (instance.certificationResources) {
        instance.coursesCount = instance.certificationResources.length
        // just returning a subset of the ResourceProvider attributes from the
        // hasMany :through association. Can't seem to find a way to remove 
        // the +resourceProviders+ attribute, so just ignore it.
        if (instance.resourceProviders) {
          instance.providers = instance.resourceProviders.map(provider => {
            return (({ id, name, description, url }) => ({ id, name, description, url }))(provider)
          })
        }
      }
    }
  });

  return TopcoderCertification
};
