'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FccCertificationProgress extends Model {

    static associate(models) {
      this.hasMany(models.FccModuleProgress, {
        as: 'moduleProgresses',
        foreignKey: 'fccCertificationProgressId'
      });

      this.belongsTo(models.FreeCodeCampCertification, {
        foreignKey: 'fccCertificationId'
      });

      this.belongsTo(models.FccCourse, {
        foreignKey: 'fccCourseId'
      });

      this.hasOne(models.CertificationResourceProgress, {
        as: 'FccCertificationProgress',
        foreignKey: 'id',
        constraints: false,
        scope: {
          resourceableType: 'FccCertificationProgress',
        }
      });
    }

    /**
     * Builds a fully-formed certification progress record from an existing 
     * FCC Certification.
     * 
     * @param {Object} certification a FreeCodeCampCertification object
     */
    static async buildFromCertification(userId, fccCertification) {
      const certCategory = await fccCertification.getCertificationCategory();
      const course = await fccCertification.getCourse();

      let progressAttrs = {
        fccCertificationId: fccCertification.id,
        userId: userId,
        fccCourseId: course.id,
        courseKey: course.key,
        certification: fccCertification.certification,
        certificationId: fccCertification.fccId,
        certificationTitle: fccCertification.title,
        certType: fccCertification.certType,
        certificationTrackType: certCategory.track,
        status: 'not-started',
      }

      const certProgress = await this.create(progressAttrs);
      await certProgress.buildModuleProgress();

      return certProgress
    }

    /**
     * Builds the collection of FccModuleProgress records for a
     * certification progress object.
     */
    async buildModuleProgress() {
      const cert = await this.getFreeCodeCampCertification();
      const course = await cert.getCourse();
      const modules = await course.getModules();

      console.log('modules', modules);
    }
  }

  FccCertificationProgress.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    fccCertificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    certProgressDynamoUuid: {
      type: DataTypes.UUID,
    },
    fccCourseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    certification: DataTypes.STRING,
    certificationId: DataTypes.STRING,
    certificationTitle: DataTypes.STRING,
    certificationTrackType: DataTypes.STRING,
    certType: DataTypes.STRING,
    courseKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("not-started", "in-progress", "completed"),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastInteractionDate: DataTypes.DATE,
    completedDate: DataTypes.DATE,
    academicHonestyPolicyAcceptedAt: DataTypes.DATE,
    currentLesson: DataTypes.STRING,
    certificationImageUrl: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'FccCertificationProgress',
    tableName: 'FccCertificationProgresses',
  });

  return FccCertificationProgress;
};