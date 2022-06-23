/**
 * Contains all routes
 */

const constants = require('../app-constants')

module.exports = {
  '/learning-paths/health': {
    get: {
      controller: 'HealthController',
      method: 'checkHealth'
    }
  },
  '/learning-paths/providers': {
    get: {
      controller: 'LearningResourceProviderController',
      method: 'searchLearningResourceProviders'
    },
  },
  '/learning-paths/providers/:providerId': {
    get: {
      controller: 'LearningResourceProviderController',
      method: 'getLearningResourceProvider'
    },
  },
  '/learning-paths/certifications': {
    get: {
      controller: 'CertificationController',
      method: 'searchCertifications'
    },
  },
  '/learning-paths/certifications/:certificationId': {
    get: {
      controller: 'CertificationController',
      method: 'getCertification'
    },
  },
  '/learning-paths/courses': {
    get: {
      controller: 'CourseController',
      method: 'searchCourses'
    },
  },
  '/learning-paths/courses/:courseId': {
    get: {
      controller: 'CourseController',
      method: 'getCourse'
    },
  },
  '/learning-paths/courses/:courseId/modules': {
    get: {
      controller: 'CourseController',
      method: 'getCourseModules'
    },
  },
  '/learning-paths/certification-progresses': {
    get: {
      controller: 'CertificationProgressController',
      method: 'searchCertificationProgresses'
    },
  },
  '/learning-paths/certification-progresses/:userId/certification/:certification': {
    get: {
      controller: 'CertificationProgressController',
      method: 'getCertificationProgress'
    },
    put: {
      controller: 'CertificationProgressController',
      method: 'updateCertificationProgress'
    },
    put: {
      controller: 'CertificationProgressController',
      method: 'updateCurrentLesson'
    },
  },
  '/learning-paths/certification-progresses/:userId/certification/:certification/complete': {
    put: {
      controller: 'CertificationProgressController',
      method: 'completeLesson'
    },
  },
}
