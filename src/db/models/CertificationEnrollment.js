'use strict';

const { Model } = require('sequelize');
const config = require('config');
const { createId } = require('@paralleldrive/cuid2');

const {
  enrollmentStatuses,
  progressStatuses
} = require('../../common/constants');
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
     * this enrollment as completed and triggers the generation of the 
     * user's Topcoder Certification digital certificate.
     */
    async checkAndSetCertCompletion() {
      const certification = await this.getTopcoderCertification();
      const certDashedName = certification.dashedName;
      const certificateUrl = await this.certificateUrl();

      // if the certification has been fully completed, return cert info
      if (this.status == enrollmentStatuses.completed) {
        return {
          certification: certDashedName,
          certificateUrl,
          completedAt: this.completedAt,
          completionUuid: this.completionUuid,
          status: this.status,
        }
      }

      const certCompleted = await this.allCertRequirementsCompleted();

      // if not all completed progresses have been completed 
      // return the current status
      if (!certCompleted) {
        return {
          certDashedName,
          certificateUrl: null,
          status: this.status
        }
      }

      // all requirements have been satisfied, so mark this as completed
      const completedAttrs = {
        completedAt: new Date(),
        completionUuid: createId(),
        status: enrollmentStatuses.completed,
      }
      const completedCert = await this.update(completedAttrs)

      // generate the TCA digital certificate image
      await this.generateCertificate();

      return {
        certification: certDashedName,
        certificateUrl: certificateUrl,
        completedAt: completedCert.completedAt,
        completionUuid: completedCert.completionUuid,
        status: completedCert.status
      };
    }

    // check to see if all of the requirements to earn the 
    // certification have been completed
    async allCertRequirementsCompleted() {
      const resourceProgresses = await this.getResourceProgresses();
      const certCompleted = resourceProgresses.every(progress => progress.isCompleted());

      return certCompleted;
    }

    /**
     * Constructs the URL from which to retieve the user Topcoder Certification 
     * completion certificate 
     * 
     * @returns the certificate URL
     */
    async certificateUrl() {
      const certification = await this.getTopcoderCertification();

      return `${config.TCA_WEBSITE_URL}/learn/tca-certifications/${certification.dashedName}/${this.userHandle}/certificate`
    }

    async generateCertificate() {
      const certification = await this.getTopcoderCertification();
      const certDashedName = certification.dashedName;
      const certificateUrl = await this.certificateUrl();
      const certificateElement = `[${config.CERT_ELEMENT_SELECTOR.attribute}=${config.CERT_ELEMENT_SELECTOR.value}]`;

      imageGenerator.generateCertificateImage(
        undefined,
        this.userHandle,
        certDashedName,
        'tca',
        certificateUrl,
        certificateElement,
        config.CERT_ADDITIONAL_PARAMS,
      )
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
          if (resourceProgress.status == progressStatuses.completed) {
            resourcesCompleted += 1;
          }
        }

        instance.certificationProgress = 0;
        if (resourceCount > 0 && resourcesCompleted > 0) {
          const rawProgress = (resourcesCompleted / resourceCount);
          instance.certificationProgress = Math.floor(rawProgress * 100);
        }
      }
    }
  });

  return CertificationEnrollment;
};