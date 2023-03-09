'use strict';

const errors = require('../../common/errors');
const {
  lessonCompletionStatuses,
  progressStatuses } = require('../../common/constants');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FccCertificationProgress extends Model {

    static associate(models) {
      this.hasMany(models.FccModuleProgress, {
        as: 'moduleProgresses',
        foreignKey: 'fccCertificationProgressId',
        onDelete: 'CASCADE'
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
        as: 'fccCourse',
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
    static async buildFromCertification(userId, fccCertification, options = {}) {
      const certCategory = await fccCertification.getCertificationCategory();
      const course = await fccCertification.getCourse();

      // if module and lesson options were passed in, set the 
      // +currrentLesson+, otherwise set it to null
      let currentLesson = null;
      if (options.module && options.lesson) {
        currentLesson = `${options.module}/${options.lesson}`
      }

      const status = options.status ? options.status : progressStatuses.notStarted;
      const startDate = options.status == progressStatuses.inProgress ? new Date() : null;

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
        status: status,
        startDate: startDate,
        currentLesson: currentLesson,
        moduleProgresses: await this.buildModuleProgresses(course, options)
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
     * at once. The +options+ object allows setting a module and 
     * lesson in progress.
     */
    static async buildModuleProgresses(course, options = {}) {
      // including FccLesson so we can get the lesson count in 
      // one query instead of n queries
      const modules = await course.getModules({
        order: ['order'],
        include: {
          model: sequelize.model('FccLesson'),
          as: 'lessons',
          attributes: ['id'],
        }
      });

      const moduleProgressAttrs = []
      for (const module of modules) {
        // if a module key was passed in, that module should 
        // be set to 'in-progress', otherwise set to 'not-started'
        let moduleStatus = progressStatuses.notStarted;
        let startDate = null;
        if (options.module && options.module === module.key) {
          moduleStatus = progressStatuses.inProgress;
          startDate = new Date();
        }

        const progressAttrs = {
          module: module.key,
          moduleStatus: moduleStatus,
          startDate: startDate,
          lessonCount: module.lessons.length,
          isAssessment: module.isAssessment,
        }
        moduleProgressAttrs.push(progressAttrs)
      }

      return moduleProgressAttrs
    }

    static async getFullCertificationProgress(userId, progressId) {
      const options = {
        where: {
          userId: userId,
          id: progressId
        },
        include: this.certProgressIncludes()
      }
      let progress = await this.findOne(options)

      return progress
    }

    static certProgressIncludes() {
      return [
        {
          model: sequelize.model('FccModuleProgress'),
          as: 'moduleProgresses',
          include: {
            model: sequelize.model('FccCompletedLesson'),
            as: 'completedLessons',
            require: false
          }
        },
        {
          model: sequelize.model('FreeCodeCampCertification'),
          as: 'freeCodeCampCertification',
          include: {
            model: sequelize.model('ResourceProvider'),
            as: 'resourceProvider',
            attributes: ['id', 'name', 'description', 'attributionStatement', 'url']
          }
        }
      ]
    }

    /**
     * Starts an existing certification progress by setting the status, the 
     * start date, and the current lesson.
     * 
     * @param {Object} options options for setting status and current lesson
     */
    async start(options = {}) {
      // if it's already been started or completed, just return it
      if (this.isInProgress() || this.isCompleted()) return this;

      // build the current lesson if module and lesson provided
      let currentLesson = null;
      if (options.module && options.lesson) {
        currentLesson = `${options.module}/${options.lesson}`
      }

      let updateAttrs = {
        status: progressStatuses.inProgress
      }

      // update the startDate if it's blank
      if (!this.startDate) {
        updateAttrs.startDate = new Date()
      }

      // update the current lesson if provided
      if (currentLesson) {
        updateAttrs.currentLesson = currentLesson;
      }

      await this.update(updateAttrs)

      return this;
    }

    async allAssessmentModulesCompleted() {
      const progresses = await this.getModuleProgresses({
        where: {
          isAssessment: true
        }
      });

      return progresses.every(module => module.isCompleted());
    }

    /**
     * Marks an FCC Certificationa as completed
     */
    async completeFccCertification(completedDate = new Date()) {
      this.set({
        completedDate: completedDate,
        status: progressStatuses.completed,
      })

      return await this.save();
    }

    /**
     * Updates the current lesson and the last interacted date
     * 
     * @param {String} currentLesson the current lesson, as 'module/lesson'
     * @returns the updated cert progress record
     */
    async updateCurrentLesson(currentLesson) {
      const updateAttrs = {
        currentLesson: currentLesson,
        lastInteractionDate: new Date()
      }

      // ensure this cert progress reflects the correct status -- if 
      // we're setting a current lesson on this progress, it's been 
      // started, so ensure that status is set.
      if (this.isNotStarted()) {
        updateAttrs.status = progressStatuses.inProgress
      }
      this.set(updateAttrs);

      this.save();

      return this;
    }

    /**
     * Gets the FccModuleProgress object that corresponds to the given FccModule 
     * 
     * @param {FccModule} fccModule the module whose matching progress we want
     */
    async getModuleProgressForModule(moduleKey) {
      const moduleProgresses = await this.getModuleProgresses({
        where: {
          module: moduleKey
        }
      })

      return moduleProgresses[0]
    }

    /**
     * Completes a lesson by adding an FccCompletedLesson object for the given
     * module and lesson.
     * 
     * @param {String} moduleKey the key of the module containing the lesson
     * @param {String} lessonDashedName the name of the lesson being completed
     * @param {String} lessonId the ID of the lesson being completed
     * @returns Object containing the resulf of the update request
     */
    async completeLesson(moduleKey, lessonDashedName, lessonId) {
      const lesson = await this.validateLesson(moduleKey, lessonDashedName, lessonId)

      const moduleProgress = await this.getModuleProgressForModule(moduleKey);
      if (!moduleProgress) {
        throw `Did not find module progress with key ${moduleKey}`
      }

      // we're completing a lesson, so ensure this progress record has 
      // the correct status 
      await this.ensureProgressStarted();

      // check if this lesson has already been completed, and if so,
      // just return this cert progress
      const lessonCount = await moduleProgress.countCompletedLessons({
        where: {
          id: lessonId
        }
      });
      if (lessonCount > 0) {
        return { result: lessonCompletionStatuses.previouslyCompleted };
      }

      // add the completed lesson
      const lessonAttrs = {
        id: lesson.id,
        dashedName: lesson.dashedName,
        completedDate: new Date()
      }

      // update the module progress with the completed lesson,
      // update the last interacted date, and check if the module
      // itself has been completed.
      try {
        await moduleProgress.createCompletedLesson(lessonAttrs);
        await moduleProgress.touchModule();
        await moduleProgress.checkAndSetModuleStatus();

        return { result: lessonCompletionStatuses.completedSuccessfully }
      } catch (error) {
        console.error(`Error completing lesson: ${error}`)
        throw error;
      }
    }

    /**
     * Ensures a progress record has been started
     */
    async ensureProgressStarted() {
      if (this.isNotStarted()) {
        await this.start();
      };
    }

    async validateLesson(moduleKey, lessonDashedName, lessonId) {
      const lesson = await this.freeCodeCampCertification.getLesson(moduleKey, lessonId);
      if (!lesson) {
        throw new errors.BadRequestError(
          `No lesson '${moduleKey}/${lessonDashedName}' exists in certification '${this.certification}'`)
      }

      return lesson;
    }

    /**
     * An implementation of hasMany :through that Sequelize 
     * seems to lack, for no apparent reason.
     * 
     * @returns an array of FccCompletedLesson objects
     */
    async completedLessons() {
      let completedLessons = [];

      const moduleProgresses = await this.getModuleProgresses({
        include: {
          model: sequelize.model('FccCompletedLesson'),
          as: 'completedLessons',
        }
      });

      for (const moduleProgress of moduleProgresses) {
        completedLessons.push(...moduleProgress.completedLessons)
      }

      return completedLessons;
    }

    // convenience methods to check status
    isNotStarted() {
      return this.status == progressStatuses.notStarted;
    }

    isInProgress() {
      return this.status == progressStatuses.inProgress;
    }

    isCompleted() {
      return this.status == progressStatuses.completed;
    }
  }

  FccCertificationProgress.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    // adding this to support clients like the 
    // Community App that we don't want to have 
    // change if we can avoid it 
    provider: {
      type: DataTypes.VIRTUAL,
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
    email: {
      type: DataTypes.STRING,
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
    certificationImageUrl: DataTypes.STRING,
    courseProgressPercentage: DataTypes.VIRTUAL,
    certificationProgressPercentage: DataTypes.VIRTUAL,
  }, {
    sequelize,
    modelName: 'FccCertificationProgress',
    tableName: 'FccCertificationProgresses',
  });

  FccCertificationProgress.addHook("afterFind", findResult => {
    if (findResult === null) return;

    if (!Array.isArray(findResult)) findResult = [findResult];

    for (const instance of findResult) {
      instance.provider = instance?.resourceProvider?.name;
    }

  });

  return FccCertificationProgress;
};