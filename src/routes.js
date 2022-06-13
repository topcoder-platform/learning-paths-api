/**
 * Contains all routes
 */

const constants = require('../app-constants')
const { SCOPES: {
  READ,
  CREATE,
  UPDATE,
  DELETE,
  ALL
} } = require('config')

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
}
