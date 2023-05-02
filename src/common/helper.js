/**
 * This file defines helper methods used across the application.
 */

const _ = require('lodash')
const querystring = require('querystring')
const errors = require('./errors')
const util = require('util')
const axios = require('axios');
const busApi = require('topcoder-bus-api-wrapper');
const config = require('config')
const constants = require('../../app-constants')
const Joi = require('joi')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME']))
const NodeCache = require('node-cache')
const { performance } = require('perf_hooks');

// configure the AWS SDK for global use << keeping till we figure out if we need this
// AWS.config.update({
//   s3: config.AMAZON.S3_API_VERSION,
//   accessKeyId: config.AMAZON.AWS_ACCESS_KEY_ID,
//   secretAccessKey: config.AMAZON.AWS_SECRET_ACCESS_KEY,
//   region: config.AMAZON.AWS_REGION
// })

// Bus API Client
let busApiClient;

/**
 * Wrap async function to standard express function
 * @param {Function} fn the async function
 * @returns {Function} the wrapped function
 */
function wrapExpress(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next)
  }
}

// Internal cache
const internalCache = new NodeCache({ stdTTL: config.INTERNAL_CACHE_TTL })

/**
 * Wrap all functions from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
function autoWrapExpress(obj) {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress)
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'AsyncFunction') {
      return wrapExpress(obj)
    }
    return obj
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value)
  })
  return obj
}

/**
 * Get link for a given page.
 * @param {Object} req the HTTP request
 * @param {Number} page the page number
 * @returns {String} link for the page
 */
function getPageLink(req, page) {
  const q = _.assignIn({}, req.query, { page })
  return `${config.API_BASE_URL}${req.path}?${querystring.stringify(q)}`
}

/**
 * Set HTTP response headers from result.
 * 
 * @param {Object} req the HTTP request
 * @param {Object} res the HTTP response
 * @param {Object} result the operation result
 */
function setResHeaders(req, res, result) {
  const totalPages = Math.ceil(result.total / result.perPage)
  if (parseInt(result.page, 10) > 1) {
    res.set('X-Prev-Page', parseInt(result.page, 10) - 1)
  }
  if (parseInt(result.page, 10) < totalPages) {
    res.set('X-Next-Page', parseInt(result.page, 10) + 1)
  }
  res.set('X-Page', parseInt(result.page, 10))
  res.set('X-Per-Page', result.perPage)
  res.set('X-Total', result.total)
  res.set('X-Total-Pages', totalPages)
  // set Link header
  if (totalPages > 0) {
    let link = `<${getPageLink(req, 1)}>; rel="first", <${getPageLink(req, totalPages)}>; rel="last"`
    if (parseInt(result.page, 10) > 1) {
      link += `, <${getPageLink(req, parseInt(result.page, 10) - 1)}>; rel="prev"`
    }
    if (parseInt(result.page, 10) < totalPages) {
      link += `, <${getPageLink(req, parseInt(result.page, 10) + 1)}>; rel="next"`
    }
    res.set('Link', link)
  }
}

/**
 * Check if the user has TCA Admin role
 * 
 * @param {Object} authUser the user
 */
function hasTCAAdminRole(authUser) {
  if (authUser && authUser.roles) {
    for (let i = 0; i < authUser.roles.length; i++) {
      if (authUser.roles[i].toLowerCase() === constants.UserRoles.TCAAdmin.toLowerCase()) {
        return true
      }
    }
  }
  return false
}

/**
 * Remove invalid properties from the object and hide long arrays
 * @param {Object} obj the object
 * @returns {Object} the new object with removed properties
 * @private
 */
function _sanitizeObject(obj) {
  try {
    return JSON.parse(JSON.stringify(obj, (name, value) => {
      if (_.isArray(value) && value.length > 30) {
        return `Array(${value.length})`
      }
      return value
    }))
  } catch (e) {
    return obj
  }
}

/**
 * Convert the object into user-friendly string which is used in error message.
 * @param {Object} obj the object
 * @returns {String} the string value
 */
function toString(obj) {
  return util.inspect(_sanitizeObject(obj), { breakLength: Infinity })
}

/**
 * Check if exists.
 *
 * @param {Array} source the array in which to search for the term
 * @param {Array | String} term the term to search
 */
function checkIfExists(source, term) {
  let terms

  if (!_.isArray(source)) {
    throw new Error('Source argument should be an array')
  }

  source = source.map(s => s.toLowerCase())

  if (_.isString(term)) {
    terms = term.toLowerCase().split(' ')
  } else if (_.isArray(term)) {
    terms = term.map(t => t.toLowerCase())
  } else {
    throw new Error('Term argument should be either a string or an array')
  }

  for (let i = 0; i < terms.length; i++) {
    if (source.includes(terms[i])) {
      return true
    }
  }

  return false
}

function validateRequestPayload(method, payload) {
  if (!method.schema) { return }

  const schema = Joi.object().keys(method.schema)

  const { error } = schema.validate({ payload })
  if (error) {
    throw error
  }
}

/**
 * Get M2M token.
 * @returns {Promise<String>} the M2M token
 */
async function getM2MToken() {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/**
 * Ensures there are no duplicate or null elements in given array.
 * @param {Array} arr the array to check
 * @param {String} name the array name
 */
function ensureNoDuplicateOrNullElements(arr, name) {
  const a = arr || []
  for (let i = 0; i < a.length; i += 1) {
    if (_.isNil(a[i])) {
      throw new errors.BadRequestError(`There is null element for ${name}.`)
    }
    for (let j = i + 1; j < a.length; j += 1) {
      if (a[i] === a[j]) {
        throw new errors.BadRequestError(`There are duplicate elements (${a[i]}) for ${name}.`)
      }
    }
  }
}

/**
 * Ensure the user can view a certification progress record
 *
 * @param {Object} currentUser the user who perform operation
 * @param {Object} progress the certification progress to check
 */
function ensureUserCanViewProgress(currentUser, progress) {
  // TODO: enable scopes to allow admins or m2m to access any data
  return ensureRequestForCurrentUser(currentUser, progress.userId)
}

/**
 * Ensure the current user matches the user whose data is being requested
 *
 * @param {Object} currentUser the user who initiated the request
 * @param {Object} reqUserId the user ID of the requested data
 */
function ensureRequestForCurrentUser(currentUser, reqUserId) {
  if (!currentUser.userId || !reqUserId || currentUser.userId !== reqUserId) {
    throw new errors.ForbiddenError(`You don't have access to this data`)
  } else {
    return true
  }
}

function pluralize(count, noun, suffix = 's') {
  return `${count} ${noun}${count !== 1 ? suffix : ''}`
}

function getFromInternalCache(key) {
  return internalCache.get(key)
}

function setToInternalCache(key, value) {
  internalCache.set(key, value)
}

function logExecutionTime(start, end, functionName, linebreak = false) {
  const duration = (end - start).toFixed(4)
  console.log(`** call to ${functionName} took ${duration} ms`)
  if (linebreak) console.log('')
}

function logExecutionTime2(start, functionName, linebreak = false) {
  const end = performance.now();
  const duration = (end - start).toFixed(4)
  console.log(`** call to ${functionName} took ${duration} ms`)
  if (linebreak) console.log('')
}

function parseQueryParam(param) {
  return param?.constructor.name === 'String'
    ? JSON.parse(param)
    : param
}

function featureFlagSet(flag, setValue) {
  const flagValue = config.FEATURE_FLAG[flag];
  return flagValue === setValue ? true : false
}

/**
 * Get private data for members by handle via M2M
 * @param {String} handle The member handle
 * @returns 
 */
async function getMemberDataM2M(handle) {
  const m2m = await getM2MToken();

  return axios(`${config.API_BASE_URL}/v5/members/${handle}`, {
    headers: {
      Authorization: `Bearer ${m2m}`
    }
  })
    .then(rsp => rsp.data)
}

async function getMemberDataFromIdM2M(userId) {
  const m2m = await getM2MToken();

  return axios(`${config.API_BASE_URL}/v5/members?userId=${userId}`, {
    headers: {
      Authorization: `Bearer ${m2m}`
    }
  })
    .then(rsp => rsp.data)
}

async function getMultiMemberDataFromIdM2M(userIds) {
  const m2m = await getM2MToken();

  let promises = [];

  for (let userId of userIds) {
    const promise = axios(`${config.API_BASE_URL}/v5/members?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${m2m}`
      }
    })
    promises.push(promise)
  }

  const rawResults = await Promise.all(promises);
  const results = rawResults.map(rr => rr.data);

  return results
}

/**
 * Queries the v3 Users API for user profile information given the 
 * user's email address.
 * 
 * @param {String} email user's email address
 * @param {String} m2mToken m2m token to use for API call
 * @param {String} fields comma-separated list of fields to return
 * @returns API response as JSON
 */
async function getUserDataFromEmail(email, m2mToken = null, fields = null) {
  if (!fields) {
    fields = 'id,handle,email'
  }

  if (!m2mToken) {
    m2mToken = await getM2MToken();
  }

  const filter = `email=${email}`
  const url = `${config.API_BASE_URL}/v3/users?fields=${fields}&filter=${filter}`

  return axios(url, {
    headers: {
      Authorization: `Bearer ${m2mToken}`
    }
  })
    .then(rsp => rsp.data)
    .catch(err => {
      console.log(err.message, email)
      return null
    })
}

/**    
 * Get Bus API Client
 * @return {Object} Bus API Client Instance
 */
function getBusApiClient() {
  // if there is no bus API client instance, then create a new instance
  if (!busApiClient) {
    busApiClient = busApi(_.pick(config,
      ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME',
        'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'BUSAPI_URL',
        'KAFKA_ERROR_TOPIC', 'AUTH0_PROXY_SERVER_URL']))
  }

  return busApiClient
}

/**
 * Post bus event.
 * @param {String} topic the event topic
 * @param {Object} payload the event payload
 */
async function postBusEvent(topic, payload) {
  const client = getBusApiClient()

  return client.postEvent({
    topic,
    originator: constants.EVENT_ORIGINATOR,
    timestamp: new Date().toISOString(),
    'mime-type': constants.EVENT_MIME_TYPE,
    payload
  })
}

module.exports = {
  autoWrapExpress,
  checkIfExists,
  ensureNoDuplicateOrNullElements,
  ensureRequestForCurrentUser,
  ensureUserCanViewProgress,
  featureFlagSet,
  getFromInternalCache,
  getMemberDataM2M,
  getMemberDataFromIdM2M,
  getMultiMemberDataFromIdM2M,
  getUserDataFromEmail,
  hasTCAAdminRole,
  logExecutionTime,
  logExecutionTime2,
  parseQueryParam,
  pluralize,
  postBusEvent,
  setResHeaders,
  setToInternalCache,
  toString,
  validateRequestPayload,
  wrapExpress,
}
