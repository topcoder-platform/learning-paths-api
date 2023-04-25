const { Model } = require('sequelize');

const DEFAULT_COMPLETION_TIME_LOW = DEFAULT_COMPLETION_TIME_HIGH = 0;
const COMPLETION_TIME_UNITS = "hours";

const COMPLETION_LOW_RANGE_DIVISOR = 2;
const COMPLETION_RANGE_MODULO = 10;

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
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    prerequisites: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    coursesCount: {
      type: DataTypes.VIRTUAL,
    },
    providers: {
      type: DataTypes.VIRTUAL,
    },
    completionTimeRange: {
      type: DataTypes.VIRTUAL,
    },
    learnedOutcomes: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    emsiSkills: {
      type: DataTypes.JSONB
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
  TopcoderCertification.addHook("afterFind", async (findResult) => {
    if (findResult === null) return;

    if (!Array.isArray(findResult)) findResult = [findResult];

    for (const instance of findResult) {
      // TODO: we are checking that the certification contains resources 
      // and resource providers, but in reality a certification without 
      // any curriculum resources isn't viable. Need to handle this case 
      // in a better way.

      // Set the estimated completion time range values to their defaults
      instance.completionTimeRange = {
        lowRangeValue: DEFAULT_COMPLETION_TIME_LOW,
        highRangeValue: DEFAULT_COMPLETION_TIME_HIGH,
        units: COMPLETION_TIME_UNITS
      }

      if (instance.certificationResources) {
        // Compute the estimated completion range based on
        // the completion time of the contained courses (resources)
        let highRange = 0;
        for (const resource of instance.certificationResources) {
          if (resource.freeCodeCampCertification) {
            const certHours = await resource.freeCodeCampCertification.getComputedCompletionHours();
            highRange += certHours;
          }
        }

        // Round the high range up to the nearest 10, and then compute the low range
        highRange = Math.ceil(highRange / COMPLETION_RANGE_MODULO) * COMPLETION_RANGE_MODULO;
        let lowRange = Math.floor(highRange / COMPLETION_LOW_RANGE_DIVISOR);
        lowRange = Math.ceil(lowRange / COMPLETION_RANGE_MODULO) * COMPLETION_RANGE_MODULO;

        instance.completionTimeRange.lowRangeValue = lowRange;
        instance.completionTimeRange.highRangeValue = highRange;

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
