'use strict';

const {
  Model
} = require('sequelize');
const { progressStatuses } = require('../../common/constants');
const { createId } = require('@paralleldrive/cuid2');
const imageGenerator = require('../../utils/certificate-sharing/generate-certificate-image/GenerateCertificateImageService');

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

    /**
     * Checks if all of the requirements to complete the associated
     * Topcoder Certification have been completed. If so, it marks 
     * this enrollment as completed and trigger the generation of the 
     * user's Topcoder Certification digital certificate.
     * 
     * @param {String} The handle of the auth user whose progress is being completed
     * @param {String} certification The name of the certification for which we are generating an image
     * @param {String} certificateUrl The URL for the certificate
     * @param {String} certificateElement (optional) The Element w/in the DOM of the certificate that 
     * @param {Object} certificateAlternateParams (optional) If there are any alternate params,
     */
    async checkAndSetCertCompletion(
      handle,
      certification,
      certificateUrl,
      certificateElement,
      certificateAlternateParams,
    ) {
      // if the certification has been completed, just 
      // return that status and the date it was completed
      if (this.status == progressStatuses.completed) {
        return {
          status: this.status,
          completedAt: this.completedAt,
          completionUuid: this.completionUuid,
        }
      }

      // check to see if all of the requirements have been completed
      const resourceProgresses = await this.getResourceProgresses();
      const certCompleted = resourceProgresses.every(progress => progress.isCompleted());

      // not all completed, so just return the current status
      if (!certCompleted) {
        return {
          status: this.status
        }
      }

      // all requirements have been satisfied, so mark this as completed
      const statusCompleted = {
        status: progressStatuses.completed,
        completedAt: new Date(),
        completionUuid: createId()
      }
      const completedEnrollment = await this.update(statusCompleted)

      // generate the TCA digital certificate social share image
      imageGenerator.generateCertificateImage(
        undefined,
        handle,
        certification,
        'TCA',
        certificateUrl,
        certificateElement,
        certificateAlternateParams,
      )

      return statusCompleted;
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
    completionUuid: {
      type: DataTypes.STRING,
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