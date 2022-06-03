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
  // '/challenges': {
  //   post: {
  //     controller: 'ChallengeController',
  //     method: 'createChallenge',
  //     auth: 'jwt',
  //     access: [constants.UserRoles.Admin, constants.UserRoles.SelfServiceCustomer, constants.UserRoles.Copilot, constants.UserRoles.Manager, constants.UserRoles.User],
  //     scopes: [CREATE, ALL]
  //   }
  // },
  '/learning-paths/health': {
    get: {
      controller: 'HealthController',
      method: 'checkHealth'
    }
  },
  '/challenge-types': {
    get: {
      controller: 'ChallengeTypeController',
      method: 'searchChallengeTypes'
    },
    post: {
      controller: 'ChallengeTypeController',
      method: 'createChallengeType',
      auth: 'jwt',
      access: [constants.UserRoles.Admin, constants.UserRoles.Copilot, constants.UserRoles.Manager],
      scopes: [CREATE, ALL]
    }
  },
  '/challenge-types/:challengeTypeId': {
    get: {
      controller: 'ChallengeTypeController',
      method: 'getChallengeType'
    },
    put: {
      controller: 'ChallengeTypeController',
      method: 'fullyUpdateChallengeType',
      auth: 'jwt',
      access: [constants.UserRoles.Admin, constants.UserRoles.Copilot, constants.UserRoles.Manager],
      scopes: [UPDATE, ALL]
    },
    patch: {
      controller: 'ChallengeTypeController',
      method: 'partiallyUpdateChallengeType',
      auth: 'jwt',
      access: [constants.UserRoles.Admin, constants.UserRoles.Copilot, constants.UserRoles.Manager],
      scopes: [UPDATE, ALL]
    }
  },
}
