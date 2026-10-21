/**
 * Configure all routes for express app
 */

const _ = require('lodash')
const config = require('config')
const { StatusCodes } = require('http-status-codes')
const helper = require('./src/common/helper')
const errors = require('./src/common/errors')
const routes = require('./src/routes')
const { authenticate, hasRequiredScopes } = require('./src/common/auth')

/**
 * Configure routes with shared-core authentication and explicit service scope metadata.
 * @param app Express app receiving route handlers.
 * @returns {void} Registers handlers; invalid private tokens return 401 and missing grants 403.
 * Legacy query tokens are redacted before logging. Public invalid tokens are anonymous; member-only routes never accept a service principal.
 */
module.exports = (app) => {
  // Load all routes
  _.each(routes, (verbs, path) => {
    _.each(verbs, (def, verb) => {
      const controllerPath = `./src/controllers/${def.controller}`
      const method = require(controllerPath)[def.method]; // eslint-disable-line
      if (!method) {
        throw new Error(`${def.method} is undefined`)
      }

      const actions = []
      actions.push((req, res, next) => {
        req.signature = `${def.controller}#${def.method}`
        next()
      })

      actions.push((req, res, next) => {
        if (_.get(req, 'query.token')) {
          _.set(req, 'headers.authorization', `Bearer ${_.trim(req.query.token)}`)
          req.query.token = '[REDACTED]'
          req.url = req.url.replace(/([?&]token=)[^&]*/g, '$1[REDACTED]')
          if (req.originalUrl) req.originalUrl = req.originalUrl.replace(/([?&]token=)[^&]*/g, '$1[REDACTED]')
        }
        next()
      })

      if (def.auth) {
        // add Authenticator/Authorization check if route has auth
        actions.push((req, res, next) => {
          authenticate(req, res, next)
        })

        actions.push((req, res, next) => {
          if (req.authUser.isMachine) {
            // M2M
            if (!hasRequiredScopes(def, req.authUser)) {
              next(new errors.ForbiddenError('You are not allowed to perform this action!'))
            } else {
              req.userToken = req.headers.authorization.split(' ')[1]
              next()
            }
          } else {
            req.authUser.userId = String(req.authUser.userId)
            // User roles authorization
            if (req.authUser.roles) {
              if (def.access && !helper.checkIfExists(_.map(def.access, a => a.toLowerCase()), _.map(req.authUser.roles, r => r.toLowerCase()))) {
                next(new errors.ForbiddenError('You are not allowed to perform this action!'))
              } else {
                req.userToken = req.headers.authorization.split(' ')[1]
                next()
              }
            } else {
              next(new errors.ForbiddenError('You are not authorized to perform this action'))
            }
          }
        })
      } else {
        // public API, but still try to authenticate token if provided, but allow missing/invalid token
        actions.push((req, res, next) => {
          if (!req.headers.authorization && !req.query.token) {
            return next()
          }
          authenticate(req, res, (error) => {
            if (error) delete req.authUser
            next()
          })
        })

        actions.push((req, res, next) => {
          if (!req.authUser) {
            next()
          } else if (req.authUser.isMachine) {
            if (!def.scopes || !hasRequiredScopes(def, req.authUser)) {
              req.authUser = undefined
            }
            next()
          } else {
            req.authUser.userId = String(req.authUser.userId)
            next()
          }
        })
      }

      actions.push(method)
      app[verb](`/${config.API_VERSION}${path}`, helper.autoWrapExpress(actions))
    })
  })

  // Check if the route is not found or HTTP method is not supported
  app.use('*', (req, res) => {
    if (routes[req.baseUrl]) {
      res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        message: 'The requested HTTP method is not supported.'
      })
    } else {
      res.status(StatusCodes.NOT_FOUND).json({
        message: 'The requested resource cannot be found.'
      })
    }
  })
}
