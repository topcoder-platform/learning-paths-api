'use strict';

const { Model } = require('sequelize');
const FccLesson = require('./FccLesson')

module.exports = (sequelize, DataTypes) => {
  class FccCertificationProgress extends Model {

    static associate(models) {
      this.hasMany(models.FccModuleProgress, {
        as: 'moduleProgresses',
        foreignKey: 'fccCertificationProgressId'
      });

      this.belongsTo(models.FreeCodeCampCertification, {
        foreignKey: 'fccCertificationId',
        as: 'freeCodeCampCertification'
      });

      // trying to create a +belongsTo :through+ association here to get 
      // the ResourceProvider via the FreeCodeCampCertification association 
      // but Sequelize doesn't support that natively, so we have to set all 
      // the keys and modify the association's cardinality manually.
      const association = this.belongsToMany(models.ResourceProvider, {
        through: models.FreeCodeCampCertification, // the join table
        as: 'resourceProvider',                    // the alias for this association
        sourceKey: 'fccCertificationId',           // the foreign key in this model's belongsTo > FreeCodeCampCertification
        otherKey: 'resourceProviderId',            // the foreign key in FreeCodeCampCertification > belongsTo > ResourceProvider
        foreignKey: 'id',                          // either the ID of ResourceProvider or ID of FreeCodeCampCertification ??
      })
      association.isMultiAssociation = false;      // to turn off the "many" of belongsToMany
      association.isSingleAssociation = true;      // apparently also required to force a singular ResourceProvider attribute
      // Oof, some of this is painful. Do better, Sequelize!

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
        moduleProgresses: await this.buildModuleProgresses(course)
      }

      // Using Sequelize's model +create+ method with an embedded 
      // association. Since we refer to the association by the 
      // alias 'moduleProgresses' we have to add the +include+
      // below.
      const certProgress = await this.create(progressAttrs,
        {
          include: [{
            model: sequelize.model('FccModuleProgress'),
            as: 'moduleProgresses'
          }]
        });

      return certProgress
    }

    /**
     * Builds the collection of FccModuleProgress records for a
     * certification progress object so they can be created all 
     * at once.
     */
    static async buildModuleProgresses(course) {
      // including FccLesson so we can get the lesson count in 
      // one query instead of n queries
      const modules = await course.getModules({
        include: {
          model: sequelize.model('FccLesson'),
          as: 'lessons',
          attributes: ['id']
        }
      });

      const moduleProgressAttrs = []
      for (const module of modules) {
        const progressAttrs = {
          module: module.key,
          moduleStatus: 'not-started',
          lessonCount: module.lessons.length,
          isAssessment: module.isAssessment,
        }
        moduleProgressAttrs.push(progressAttrs)
      }

      return moduleProgressAttrs
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