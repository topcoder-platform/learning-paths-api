const { Model } = require('sequelize');

const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`;

module.exports = (sequelize, DataTypes) => {
  class CertificationResource extends Model {
    static associate(models) {
      this.belongsTo(models.TopcoderCertification, {
        as: 'CertificationResource',
        foreignKey: 'topcoderCertificationId'
      });

      this.belongsTo(models.FreeCodeCampCertification, {
        as: 'FreeCodeCampCertification',
        foreignKey: 'resourceableId',
        constraints: false,
      });

      // TODO: leaving this here as a marker for future implementation
      // when we add in another resource provider. Currently only using
      // FreeCodeCamp, but if/when we add another resource provider, we
      // will need to add this type of polymorphic association. 

      // this.belongsTo(models.TopcoderUdemyCourse, {
      //   as: 'TopcoderUdemyCourse',
      //   foreignKey: 'resourceableId',
      //   constraints: false,
      // });
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
    topcoderCertificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TopcoderCertification',
        key: 'id'
      }
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
    modelName: 'CertificationResource',
    schema: 'public',
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
    console.log('** in afterFind hook');

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
