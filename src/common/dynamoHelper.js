const AWS = require('aws-sdk');
const {
    DynamoDBClient,
    TransactWriteItemsCommand
} = require("@aws-sdk/client-dynamodb");
const config = require('config');
const crypto = require('crypto');
const errors = require('./errors');
const models = require('../models');
const xss = require('xss');

AWS.config.update({
    s3: config.AMAZON.S3_API_VERSION,
    accessKeyId: config.AMAZON.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AMAZON.AWS_SECRET_ACCESS_KEY,
    region: config.AMAZON.AWS_REGION
})

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

module.exports = {
    addCompletedLessonNative,
    create,
    fullyMatch,
    generateClientToken,
    getById,
    getByIdAndUser,
    getByIds,
    getByTableKeys,
    getCertProgressByIdAndCertification,
    partialMatch,
    queryCompletedCertifications,
    scan,
    scanAll,
    update,
    updateAtomic,
    validateDuplicate,

}