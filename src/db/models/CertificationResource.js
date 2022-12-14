const { Model } = require('sequelize');

const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`;

module.exports = (sequelize, DataTypes) => {
  class CertificationResource extends Model {
    static associate(models) {
      this.hasMany(models.FreeCodeCampCertification, {
        foreignKey: 'resourceableId',
        constraints: false,
        scope: {
          resourceableType: 'FreeCodeCampCertification'
        }
      });

      this.hasMany(models.TopcoderUdemyCourse, {
        foreignKey: 'resourceableId',
        constraints: false,
        scope: {
          resourceableType: 'TopcoderUdemyCourse'
        }
      });
    }

    getResourceable(options) {
      if (!this.resourceableType) return Promise.resolve(null);

      const mixinMethodName = `get${uppercaseFirst(this.resourceableType)}`;
      return this[mixinMethodName](options);
    }
  }

  CertificationResource.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    resourceProviderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ResourceProvider',
        key: 'id'
      }
    },
    resourceableId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    resourceableType: {
      type: DataTypes.ENUM("FreeCodeCampCertification", "TopcoderUdemyCourse"),
      allowNull: false
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    completionOrder: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    resourceDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resourceTitle: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'CertificationResource',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "CertificationResource_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  CertificationResource.addHook("afterFind", findResult => {
    if (!Array.isArray(findResult)) findResult = [findResult];

    for (const instance of findResult) {
      if (instance.resourceableType === "FreeCodeCampCertification" && instance.FreeCodeCampCertification !== undefined) {
        instance.resource = instance.FreeCodeCampCertification;
      } else if (instance.resourceableType === "TopcoderUdemyCourse" && instance.TopcoderUdemyCourse !== undefined) {
        instance.resource = instance.TopcoderUdemyCourse;
      }

      // To prevent mistakes:
      delete instance.FreeCodeCampCertification;
      delete instance.dataValues.FreeCodeCampCertification;
      delete instance.TopcoderUdemyCourse;
      delete instance.dataValues.TopcoderUdemyCourse;
    }
  });

  return CertificationResource;
};
