/**
 * This file defines helper methods
 */
const axios = require('axios')
const Joi = require('joi')
const _ = require('lodash')
const querystring = require('querystring')
const models = require('../models')
const errors = require('./errors')
const util = require('util')
const AWS = require('aws-sdk')
const config = require('config')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME']))
const NodeCache = require('node-cache')
const HttpStatus = require('http-status-codes')
const xss = require('xss')
const { CertificationProgress } = require('../models')
const { performance } = require('perf_hooks');

AWS.config.update({
  s3: config.AMAZON.S3_API_VERSION,
  accessKeyId: config.AMAZON.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AMAZON.AWS_SECRET_ACCESS_KEY,
  region: config.AMAZON.AWS_REGION
})

const completedCertAttributes = [
  "id",
  "providerUrl",
  "certificationId",
  "userId",
  "certification",
  "certificationTitle",
  "certType",
  "certificationTrackType",
  "provider",
  "startDate",
  "completedDate",
  "status"
]

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
 * Check if the user has admin role
 * @param {Object} authUser the user
 */
function hasAdminRole(authUser) {
  if (authUser && authUser.roles) {
    for (let i = 0; i < authUser.roles.length; i++) {
      if (authUser.roles[i].toLowerCase() === constants.UserRoles.Admin.toLowerCase()) {
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

/**
 * Get Data by model id
 * @param {String} modelName The dynamoose model name
 * @param {String} id The id value
 * @returns {Promise<void>}
 */
async function getById(modelName, id) {
  return new Promise((resolve, reject) => {
    models[modelName].query('id').eq(id).consistent().exec((err, result) => {
      if (err) {
        return reject(err)
      }
      if (result.length > 0) {
        return resolve(result[0])
      } else {
        return reject(new errors.NotFoundError(`${modelName} with id: ${id} doesn't exist`))
      }
    })
  })
}

/**
 * Get Data by model id scoped to the given user ID
 * 
 * @param {String} modelName The dynamoose model name
 * @param {String} id The id value
 * @param {String} userId The id of the user to scope responses to
 * @returns {Promise<void>}
 */
async function getByIdAndUser(modelName, id, userId) {
  return new Promise((resolve, reject) => {
    models[modelName].query('id').eq(id).where('userId').eq(userId).consistent().exec((err, result) => {
      if (err) {
        return reject(err)
      }
      if (result.length > 0) {
        return resolve(result[0])
      } else {
        return reject(new errors.NotFoundError(`${modelName} with id: ${id} for userId: ${userId} doesn't exist`))
      }
    })
  })
}

/**
 * Get Data by hashkey and rangekey
 * @param {String} modelName The dynamoose model name
 * @param {Object} tableKeys JSON object describing the table's hashKey and 
 *    rangeKey attributes and their search values
 * @returns {Promise<void>}
 */
async function getByTableKeys(modelName, tableKeys) {
  return new Promise((resolve, reject) => {
    models[modelName].get((tableKeys), { "consistent": true }, (err, result) => {
      if (err) {
        return reject(err)
      }
      if (result) {
        return resolve(result)
      } else {
        return reject(new errors.NotFoundError(
          `${modelName} with table keys: ${JSON.stringify(tableKeys, null, 2)} doesn't exist`))
      }
    })
  })
}

/**
 * Get Data by secondary index
 * 
 * @param {String} modelName The dynamoose model name
 * @param {String} attribute The attribute to query
 * @param {String} id The attribute value value
 * @param {String} index The name of the secondary index to query
 * 
 * @returns {Promise<void>}
 */
async function queryCompletedCertifications(userId) {
  return new Promise((resolve, reject) => {
    let queryStatement = CertificationProgress.
      query("userId").eq(userId).
      using("userCertificationProgressIndex").
      attributes(completedCertAttributes).
      where("status").eq("completed");

    queryStatement.exec((err, results) => {
      if (err) {
        return reject(err)
      }
      if (results.length > 0) {
        return resolve(results)
      } else {
        return resolve(results)
      }
    })
  })
}

/**
 * Get Data by model ids
 * @param {String} modelName The dynamoose model name
 * @param {Array} ids The ids
 * @returns {Promise<Array>} the found entities
 */
async function getByIds(modelName, ids) {
  const entities = []
  const theIds = ids || []
  for (const id of theIds) {
    entities.push(await getById(modelName, id))
  }
  return entities
}

/**
 * Validate the data to ensure no duplication
 * @param {Object} modelName The dynamoose model name
 * @param {String} name The attribute name of dynamoose model
 * @param {String} value The attribute value to be validated
 * @returns {Promise<void>}
 */
async function validateDuplicate(modelName, name, value) {
  const list = await scan(modelName)
  for (let i = 0; i < list.length; i++) {
    if (list[i][name] && String(list[i][name]).toLowerCase() === String(value).toLowerCase()) {
      throw new errors.ConflictError(`${modelName} with ${name}: ${value} already exist`)
    }
  }
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
 * Create item in database
 * @param {Object} modelName The dynamoose model name
 * @param {Object} data The create data object
 * @returns {Promise<void>}
 */
async function create(modelName, data) {
  return new Promise((resolve, reject) => {
    const dbItem = new models[modelName](data)
    dbItem.save((err) => {
      if (err) {
        return reject(err)
      } else {
        return resolve(dbItem)
      }
    })
  })
}

/**
 * Update item in database
 * @param {Object} dbItem The Dynamo database item
 * @param {Object} data The updated data object
 * @returns {Promise<void>}
 */
async function update(dbItem, data) {
  const startTime = performance.now()

  Object.keys(data).forEach((key) => {
    dbItem[key] = data[key]
  })
  return new Promise((resolve, reject) => {
    dbItem.save((err) => {
      if (err) {
        return reject(err)
      } else {
        const endTime = performance.now()
        logExecutionTime(startTime, endTime, 'helper.update')
        return resolve(dbItem)
      }
    })
  })
}

/**
 * Get data collection by scan parameters
 * @param {Object} modelName The dynamoose model name
 * @param {Object} scanParams The scan parameters object
 * @returns {Promise<void>}
 */
async function scan(modelName, scanParams) {
  return new Promise((resolve, reject) => {
    models[modelName].scan(scanParams).exec((err, result) => {
      if (err) {
        return reject(err)
      } else {
        return resolve(result.count === 0 ? [] : result)
      }
    })
  })
}

/**
 * Get all data collection (avoid default page limit of DynamoDB) by scan parameters
 * @param {Object} modelName The dynamoose model name
 * @param {Object} scanParams The scan parameters object
 * @returns {Array}
 */
async function scanAll(modelName, scanParams) {
  const startTime = performance.now()

  let results = await models[modelName].scan(scanParams).consistent().exec()
  let lastKey = results.lastKey
  while (!_.isUndefined(results.lastKey)) {
    const newResult = await models[modelName].scan(scanParams).consistent().startAt(lastKey).exec()
    results = [...results, ...newResult]
    lastKey = newResult.lastKey
  }
  const endTime = performance.now()
  logExecutionTime(startTime, endTime, 'scanAll');

  return results
}

/**
 * Test whether the given value is partially match the filter.
 * @param {String} filter the filter
 * @param {String} value the value to test
 * @returns {Boolean} the match result
 */
function partialMatch(filter, value) {
  if (filter) {
    if (value) {
      const filtered = xss(filter)
      return _.toLower(value).includes(_.toLower(filtered))
    } else {
      return false
    }
  } else {
    return true
  }
}

/**
 * Test whether the given value fully matches the filter.
 * @param {String} filter the filter
 * @param {String} value the value to test
 * @returns {Boolean} the match result
 */
function fullyMatch(filter, value) {
  if (filter) {
    if (value) {
      const filtered = xss(filter)
      return _.toLower(value) === _.toLower(filtered)
    } else {
      return false
    }
  } else {
    return true
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
  if (currentUser.userId != reqUserId) {
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

module.exports = {
  autoWrapExpress,
  checkIfExists,
  create,
  ensureNoDuplicateOrNullElements,
  ensureRequestForCurrentUser,
  ensureUserCanViewProgress,
  fullyMatch,
  getById,
  getByIdAndUser,
  getByIds,
  getByTableKeys,
  getFromInternalCache,
  hasAdminRole,
  logExecutionTime,
  partialMatch,
  pluralize,
  queryCompletedCertifications,
  scan,
  scanAll,
  setResHeaders,
  setToInternalCache,
  toString,
  validateDuplicate,
  validateRequestPayload,
  update,
  wrapExpress,
}
