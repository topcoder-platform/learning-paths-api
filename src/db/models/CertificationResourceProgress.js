'use strict';

const {
  Model
} = require('sequelize');
const { progressStatuses } = require('../../common/constants');

const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`;

module.exports = (sequelize, DataTypes) => {
  class CertificationResourceProgress extends Model {
    static associate(models) {
      this.belongsTo(models.CertificationEnrollment, {
        as: 'certificationEnrollment',
        foreignKey: 'certificationEnrollmentId'
      });

      this.belongsTo(models.CertificationResource, {
        as: 'certificationResource',
        foreignKey: 'certificationResourceId',
      });

      this.belongsTo(models.FccCertificationProgress, {
        as: 'fccCertificationProgress',
        foreignKey: 'resourceProgressId',
        constraints: false,
      });
    }

    /**
     * Checks if the given resource progress object (for example, an FccCertificationProgress)
     * is referenced by a CertificationResourceProgress object, and if so, updates 
     * the associated CertResourceProgress status from its status.
     * 
     * @param {Object} resourceProgress a progress object for an associated resource
     */
    static async checkAndUpdateStatusFromResource(resourceProgress) {
      const resourceProgressId = resourceProgress?.id;
      const resourceProgressType = resourceProgress?.constructor.name;

      if (resourceProgressId && resourceProgressType) {
        const certResourceProgress = await this.findOne({
          where: {
            resourceProgressId: resourceProgressId,
            resourceProgressType: resourceProgressType
          }
        })

        // if we find a CertificationResourceProgress object for the given 
        // resourceProgress, and the statuses don't match, update the status 
        // of the CertificationResourceProgress object.
        if (certResourceProgress) {
          if (certResourceProgress.status != resourceProgress.status) {
            await certResourceProgress.update({
              status: resourceProgress.status
            })
          }
        }
      }
    }

    /**
     * Marks a resource progress as complete
     */
    async setCompleted() {
      return await this.update({ status: progressStatuses.completed })
    }

    isCompleted() {
      return this.status == progressStatuses.completed
    }

    /**
     * Get the associated resource progress object, regardless of type
     * 
     * @param {Object} options 
     * @returns the progress object
     */
    getProgressable(options) {
      if (!this.resourceProgressType) return Promise.resolve(null);

      const mixinMethodName = `get${uppercaseFirst(this.resourceProgressType)}`;
      return this[mixinMethodName](options);
    }
  }

  CertificationResourceProgress.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    certificationEnrollmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: 'CertificationEnrollments',
          schema: 'public'
        },
        key: 'id'
      },
    },
    certificationResourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: 'CertificationResource',
          schema: 'public'
        },
        key: 'id'
      },
    },
    status: {
      type: DataTypes.ENUM("not-started", "in-progress", "completed"),
      defaultValue: "not-started",
    },
    resourceProgressId: DataTypes.INTEGER,
    resourceProgressType: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CertificationResourceProgress',
    tableName: 'CertificationResourceProgresses',
    schema: 'public',
    indexes: [
      {
        name: "CertificationResourceProgress_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  return CertificationResourceProgress;
};