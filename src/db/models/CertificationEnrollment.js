'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CertificationEnrollment extends Model {
    static associate(models) {
      this.belongsTo(models.TopcoderCertification, {
        as: 'topcoderCertification',
        foreignKey: 'topcoderCertificationId'
      });

      this.hasMany(models.CertificationResourceProgress, {
        as: 'resourceProgresses',
        foreignKey: 'certificationEnrollmentId',
        onDelete: 'CASCADE'
      });
    }
  }

  CertificationEnrollment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    topcoderCertificationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userHandle: {
      type: DataTypes.STRING
    },
    userName: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM("enrolled", "disenrolled", "completed"),
      defaultValue: "enrolled",
    },
    completedAt: {
      type: DataTypes.DATE
    },
    coursesCount: {
      type: DataTypes.VIRTUAL,
    },
    certificationProgress: {
      type: DataTypes.VIRTUAL,
    },
  }, {
    sequelize,
    modelName: 'CertificationEnrollment',
    tableName: 'CertificationEnrollments',
  });

  // add computed (virtual) attributes
  CertificationEnrollment.addHook("afterFind", findResult => {
    if (findResult === null) return;

    if (!Array.isArray(findResult)) findResult = [findResult];

    for (const instance of findResult) {
      // compute the certification progress in terms of the 
      // number of resources (courses) completed versus the 
      // total resources that make up the certification
      if (instance.resourceProgresses) {
        const resourceCount = instance.resourceProgresses.length;
        instance.coursesCount = resourceCount;

        let resourcesCompleted = 0;
        for (const resourceProgress of instance.resourceProgresses) {
          if (resourceProgress.status == 'completed') {
            resourcesCompleted += 1;
          }
        }

        instance.certificationProgress = 0;
        if (resourceCount > 0) {
          const rawProgress = (resourcesCompleted / resourceCount);
          instance.certificationProgress = Math.floor(rawProgress * 100);
        }
      }
    }
  });

  return CertificationEnrollment;
};