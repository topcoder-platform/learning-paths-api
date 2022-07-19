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
  '/learning-paths/certification-progresses/:certificationProgressId': {
    get: {
      controller: 'CertificationProgressController',
      method: 'getCertificationProgress'
    },
    delete: {
      controller: 'CertificationProgressController',
      method: 'deleteCertificationProgress'
    },
  },
  '/learning-paths/certification-progresses/:certificationProgressId/honesty-policy': {
    put: {
      controller: 'CertificationProgressController',
      method: 'acceptAcademicHonestyPolicy'
    }
  },
  '/learning-paths/certification-progresses/:certificationProgressId/current-lesson': {
    put: {
      controller: 'CertificationProgressController',
      method: 'updateCurrentLesson'
    }
  },
  '/learning-paths/certification-progresses/:userId/:certificationId/:courseId': {
    post: {
      controller: 'CertificationProgressController',
      method: 'startCertification'
    },
  },
  '/learning-paths/certification-progresses/:certificationProgressId/complete-lesson': {
    put: {
      controller: 'CertificationProgressController',
      method: 'completeLesson'
    },
  },
  '/learning-paths/certification-progresses/:certificationProgressId/complete-certification': {
    put: {
      controller: 'CertificationProgressController',
      method: 'completeCertification'
    },
  },
  '/learning-paths/completed-certifications/:userId': {
    get: {
      controller: 'CompletedCertificationsController',
      method: 'getCompletedCertifications'
    },
  },
}
