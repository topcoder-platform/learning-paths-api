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
  '/learning-resource-providers': {
    get: {
      controller: 'LearningResourceProviderController',
      method: 'searchLearningResourceProviders'
    },
  },
  '/learning-resource-providers/:learningResourceProviderId': {
    get: {
      controller: 'LearningResourceProviderController',
      method: 'getLearningResourceProvider'
    },
  },
  '/certifications': {
    get: {
      controller: 'CertificationController',
      method: 'searchCertifications'
    },
  },
  '/certifications/:certificationId': {
    get: {
      controller: 'CertificationController',
      method: 'getCertification'
    },
  },
  '/courses': {
    get: {
      controller: 'CourseController',
      method: 'searchCourses'
    },
  },
  '/courses/:courseId': {
    get: {
      controller: 'CourseController',
      method: 'getCourse'
    },
  },
  '/courses/:courseId/modules': {
    get: {
      controller: 'CourseController',
      method: 'getCourseModules'
    },
  },
}
