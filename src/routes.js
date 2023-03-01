/**
 * Contains all routes
 */

const constants = require('../app-constants')

const { SCOPES: {
  UPDATE,
} } = require('config')

module.exports = {
  '/learning-paths/health': {
    get: {
      controller: 'HealthController',
      method: 'checkHealth'
    }
  },

  /**
   * The following endpoints are specifically for freeCodeCamp resources
   */

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
      method: 'searchCertificationProgresses',
      auth: 'jwt'
    },
  },
  '/learning-paths/certification-progresses/:certificationProgressId': {
    get: {
      controller: 'CertificationProgressController',
      method: 'getCertificationProgress',
      auth: 'jwt'
    },
    delete: {
      controller: 'CertificationProgressController',
      method: 'deleteCertificationProgress',
      auth: 'jwt'
    },
  },
  '/learning-paths/certification-progresses/:certificationProgressId/last-lesson/:module': {
    delete: {
      controller: 'CertificationProgressController',
      method: 'deleteLastModuleLesson',
      auth: 'jwt',
      access: [constants.UserRoles.TCAAdmin],
    },
  },
  '/learning-paths/certification-progresses/:certificationProgressId/honesty-policy': {
    put: {
      controller: 'CertificationProgressController',
      method: 'acceptAcademicHonestyPolicy',
      auth: 'jwt'
    }
  },
  '/learning-paths/certification-progresses/:certificationProgressId/current-lesson': {
    put: {
      controller: 'CertificationProgressController',
      method: 'updateCurrentLesson',
      auth: 'jwt'
    }
  },
  '/learning-paths/certification-progresses/:userId/:certificationId/:courseId': {
    post: {
      controller: 'CertificationProgressController',
      method: 'startCertification',
      auth: 'jwt'
    },
  },
  '/learning-paths/certification-progresses/:certificationProgressId/complete-lesson': {
    put: {
      controller: 'CertificationProgressController',
      method: 'completeLesson',
      auth: 'jwt'
    },
  },
  '/learning-paths/certification-progresses/complete-lesson-via-mongo-trigger': {
    put: {
      controller: 'CertificationProgressController',
      method: 'completeLessonViaMongoTrigger',
      auth: 'jwt',
      scopes: [UPDATE]
    },
  },
  '/learning-paths/certification-progresses/:certificationProgressId/complete-certification': {
    put: {
      controller: 'CertificationProgressController',
      method: 'completeCertification',
      auth: 'jwt'
    },
  },
  '/learning-paths/completed-certifications/:userId': {
    get: {
      controller: 'CompletedCertificationsController',
      method: 'getCompletedCertifications'
    },
  },
  '/learning-paths/shortcut-fcc-course-completion/:certificationProgressId': {
    put: {
      controller: 'CourseCompletionShortcutController',
      method: 'shortcutFccCourseCompletion',
      auth: 'jwt',
      access: [constants.UserRoles.TCAAdmin],
    },
  },
  /**
   * The following endpoints support Topcoder Academy Certifications
   */
  '/learning-paths/topcoder-certifications': {
    get: {
      controller: 'TopcoderCertificationController',
      method: 'searchCertifications'
    },
  },
  '/learning-paths/topcoder-certifications/:dashedName': {
    get: {
      controller: 'TopcoderCertificationController',
      method: 'getCertification'
    }
  },
  '/learning-paths/topcoder-certifications/:userId/progresses': {
    get: {
      controller: 'CertificationEnrollmentController',
      method: 'getUserEnrollmentProgresses',
      auth: 'jwt',
    },
  },
  '/learning-paths/topcoder-certifications/:certificationDashedName/:userId/progress': {
    get: {
      controller: 'CertificationEnrollmentController',
      method: 'getEnrollmentProgress',
      auth: 'jwt',
    },
  },
  '/learning-paths/topcoder-certifications/:dashedName/:userHandle/validate': {
    get: {
      controller: 'TopcoderCertificationController',
      method: 'validateCertOwnership',
    },
  },
  '/learning-paths/topcoder-certifications/:userId/:certificationId/enroll': {
    post: {
      controller: 'CertificationEnrollmentController',
      method: 'enrollUser',
      auth: 'jwt',
    },
  },
  '/learning-paths/topcoder-certifications/:userId/:certificationId/unenroll': {
    delete: {
      controller: 'CertificationEnrollmentController',
      method: 'unEnrollUser',
      auth: 'jwt',
    },
  },
  '/learning-paths/certification-enrollment/:id': {
    get: {
      controller: 'CertificationEnrollmentController',
      method: 'getEnrollment',
    },
  },
  '/learning-paths/user-certification-enrollment/:userId': {
    get: {
      controller: 'CertificationEnrollmentController',
      method: 'getAllUserEnrollments',
      auth: 'jwt',
    },
  },
  '/learning-paths/user-certification-enrollment/:userId/:certificationId': {
    get: {
      controller: 'CertificationEnrollmentController',
      method: 'getUserEnrollment',
      auth: 'jwt',
    },
  },
  '/learning-paths/certification-enrollment-progress/:enrollmentId': {
    get: {
      controller: 'CertificationEnrollmentController',
      method: 'getEnrollmentProgress',
      auth: 'jwt',
    },
  },
  '/learning-paths/certification-enrollment-progresses/:userId': {
    get: {
      controller: 'CertificationEnrollmentController',
      method: 'getUserEnrollmentProgresses',
      auth: 'jwt',
    },
  },
  '/learning-paths/certification-enrollment-progresses/:resourceProgressType/:resourceProgressId': {
    put: {
      controller: 'CertificationEnrollmentController',
      method: 'completeEnrollmentProgress',
      auth: 'jwt',
    },
  },
  /**
   * Stripe related endpoints
   */
  // TODO: Activate this endpoint for TCA Premium
  // '/learning-paths/payments/stripe/subscribe': {
  //   post: {
  //     controller: 'StripePaymentsController',
  //     method: 'createSubscriptionHandler',
  //     auth: 'jwt',
  //   },
  // },
  // '/learning-paths/payments/stripe/prices': {
  //   get: {
  //     controller: 'StripePaymentsController',
  //     method: 'searchPricesHandler',
  //     auth: 'jwt',
  //   },
  // },
  // '/learning-paths/payments/stripe/prices/:id': {
  //   get: {
  //     controller: 'StripePaymentsController',
  //     method: 'getPriceHandler',
  //     auth: 'jwt',
  //   },
  // },
  // '/learning-paths/payments/stripe/products': {
  //   get: {
  //     controller: 'StripePaymentsController',
  //     method: 'searchProductsHandler',
  //     auth: 'jwt',
  //   },
  // },
  // '/learning-paths/payments/stripe/products/:id': {
  //   get: {
  //     controller: 'StripePaymentsController',
  //     method: 'getProductHandler',
  //     auth: 'jwt',
  //   },
  // },
  // '/learning-paths/payments/stripe/purchase-certifications': {
  //   post: {
  //     controller: 'StripePaymentsController',
  //     method: 'purchaseCertificationsHandler',
  //     auth: 'jwt',
  //   },
  // },
}
