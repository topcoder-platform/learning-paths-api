/**
 * This file defines helper methods
 */
// Create service client module using ES6 syntax.
const {
  DynamoDBClient,
  TransactWriteItemsCommand } = require("@aws-sdk/client-dynamodb");

const constants = require('../../app-constants')
const crypto = require('crypto')
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
const xss = require('xss')
const { CertificationProgress } = require('../models')
const { performance } = require('perf_hooks');
const axios = require('axios');
const busApi = require('topcoder-bus-api-wrapper');

AWS.config.update({
  s3: config.AMAZON.S3_API_VERSION,
  accessKeyId: config.AMAZON.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AMAZON.AWS_SECRET_ACCESS_KEY,
  region: config.AMAZON.AWS_REGION
})

// Bus API Client
let busApiClient;

const ddbClient = new DynamoDBClient({
  region: config.AMAZON.AWS_REGION,
  endpoint: config.AMAZON.DYNAMODB_URL
});

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
 * Get a CertificationProgress by id and named certification
 * 
 * @param {String} id The id value
 * @param {String} certification The name of the certification
 * @returns {Promise<void>}
 */
async function getCertProgressByIdAndCertification(id, certification) {
  return new Promise((resolve, reject) => {
    models['CertificationProgress'].query('id').eq(id).where('certification').eq(certification).consistent().exec((err, result) => {
      if (err) {
        return reject(err)
      }
      if (result.length > 0) {
        return resolve(result[0])
      } else {
        return reject(new errors.NotFoundError(`CertificationProgress with id: ${id} for certification: ${certification} doesn't exist`))
      }
    })
  })
}

/**
 * Get Data by hashkey and rangekey
 * 
 * @param {String} modelName The dynamoose model name
 * @param {Object} tableKeys JSON object describing the table's hashKey and 
 *    rangeKey attributes and their search values
 * @returns {Promise<void>}
 */
async function getByTableKeys(modelName, tableKeys) {
  return new Promise((resolve, reject) => {
    models[modelName].get((tableKeys), (err, result) => {
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
 * Update an item in the database atomically
 * 
 * @param {Object} modelName The Dynamomoose model name
 * @param {Object} idObj An object containing the id attributes of the item to update
 * @param {Object} updateObj The updated data object
 * @returns {Promise<void>}
 */
async function updateAtomic(modelName, idObj, updateObj) {
  const startTime = performance.now()

  return new Promise((resolve, reject) => {
    models[modelName].update(idObj, updateObj, (err, dbItem) => {
      if (err) {
        return reject(err)
      } else {
        const endTime = performance.now()
        // logExecutionTime(startTime, endTime, 'helper.updateAtomic')
        return resolve(dbItem)
      }
    })
  })
}

/**
 * Uses the native AWS DynamoDB SDK to add a completed lesson to the CertificationProgress
 * record's course module's completedLessons array. Also updated the module's status and 
 * the record's updatedAt timestamp.
 * 
 * @param {Object} keyFields object containing the partion and sort key field names and values
 * @param {Object} updateObj object comprising the data to update
 * @returns the updated CertificationProgress record
 */
async function addCompletedLessonNative(keyFields, updateObj) {
  const { itemIndex, moduleStatus, addItem } = updateObj;

  const progressId = keyFields.partitionKey.value;
  const certification = keyFields.sortKey.value;
  const key = {
    [keyFields.partitionKey.key]: { "S": progressId },
    [keyFields.sortKey.key]: { "S": certification }
  }

  const moduleIndex = `modules[${itemIndex}]`
  const lessonExprValue = `${moduleIndex}.completedLessons`
  const statusExprValue = `${moduleIndex}.moduleStatus`

  // Build the update expression to add the completed lesson, set the 
  // module status, and the updatedAt timestamp
  var updateExpr = `SET ${lessonExprValue} = list_append(${lessonExprValue}, :lesson)`;
  updateExpr += `, ${statusExprValue} = :moduleStatus`
  updateExpr += `, updatedAt = :updatedAt`

  const lessonId = addItem.id;
  // Note: you must coerce values to strings for DynamoDB
  const exprAttrValues = {
    ":lesson": {
      "L": [
        {
          "M": {
            "id": {
              "S": lessonId
            },
            "completedDate": {
              "N": addItem.completedDate.toString()
            },
            "dashedName": {
              "S": addItem.dashedName
            }
          }
        }
      ]
    },
    ":moduleStatus": {
      "S": moduleStatus
    },
    ":updatedAt": {
      "N": Date.now().toString()
    }
  };

  const updateParams = {
    TableName: 'CertificationProgress',
    Key: key,
    UpdateExpression: updateExpr,
    ExpressionAttributeValues: exprAttrValues,
    ReturnValues: "ALL_NEW"
  };

  // +ClientRequestToken+ is an idempotency token to prevent the same 
  // update occurring again within 10 minutes (per AWS docs)
  const transUpdateInput = {
    ClientRequestToken: generateClientToken(progressId, lessonId),
    TransactItems: [
      {
        Update: updateParams
      }
    ]
  }

  try {
    const startTime = performance.now();
    const transactCmd = new TransactWriteItemsCommand(transUpdateInput);
    await ddbClient.send(transactCmd);
    logExecutionTime2(startTime, 'transactionWrite');
  } catch (error) {
    if (error instanceof IdempotentParameterMismatchException) {
      // logging this for now just so we can get a sense when this
      // is occurring. TODO: remove this once we have confidence that 
      // the duplicate updates are fixed.
      console.log(`** IdempotentParameterMismatchException for lesson ${lessonId}`)
    } else {
      // something else happened
      console.error(error)
    }
  } finally {
    // return the current progress record regardless
    return await getCertProgressByIdAndCertification(progressId, certification)
  }
}

/**
 * Returns a unique idempotency token for use in a DynamoDB transaction that
 * adds a completed lesson to a user's certification progress record. Though 
 * not stated in the AWS docs, this string must be <= 36 characters in length.
 * 
 * @param {String} progressId the certification progress ID of the record to update
 * @param {String} lessonId the ID of the module lesson to add
 * @returns a hex string of the MD5 hash of the two input values
 */
function generateClientToken(progressId, lessonId) {
  return crypto.createHash('md5').update(`${progressId}:${lessonId}`).digest('hex')
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
  let results = await models[modelName].scan(scanParams).consistent().exec()
  let lastKey = results.lastKey

  while (!_.isUndefined(lastKey)) {
    const newResult = await models[modelName].scan(scanParams).consistent().startAt(lastKey).exec();
    results = [...results, ...newResult]
    lastKey = newResult.lastKey
  }

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
  return flagValue == setValue ? true : false
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

/**
 * Send emails via TC-BUS and SendGrid
 * @param {object} payload the email payload to send
 */
async function sendEmail(payload) {
  const defaultPayload = {
    from: {
      email: 'noreply@topcoder.com',
      name: 'Topcoder Academy'
    },
    cc: [],
    version: 'v3'
  }

  return postBusEvent('external.action.email', {
    ...defaultPayload,
    ...payload
  });
}

module.exports = {
  addCompletedLessonNative,
  autoWrapExpress,
  checkIfExists,
  create,
  ensureNoDuplicateOrNullElements,
  ensureRequestForCurrentUser,
  ensureUserCanViewProgress,
  featureFlagSet,
  fullyMatch,
  getById,
  getByIdAndUser,
  getByIds,
  getByTableKeys,
  getFromInternalCache,
  getMemberDataM2M,
  getMemberDataFromIdM2M,
  getMultiMemberDataFromIdM2M,
  getUserDataFromEmail,
  hasTCAAdminRole,
  logExecutionTime,
  logExecutionTime2,
  parseQueryParam,
  partialMatch,
  pluralize,
  postBusEvent,
  queryCompletedCertifications,
  scan,
  scanAll,
  sendEmail,
  setResHeaders,
  setToInternalCache,
  toString,
  validateDuplicate,
  validateRequestPayload,
  update,
  updateAtomic,
  wrapExpress,
}
