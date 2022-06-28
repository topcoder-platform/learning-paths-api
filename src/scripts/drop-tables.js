/**
 * Drop tables in database. All data will be cleared.
 */

const dynamoose = require('dynamoose')
const models = require('../models')
const { includes } = require('lodash')
const logger = require('../common/logger')

logger.info('Requesting to delete tables...')

const promises = []
const skipModels = ['DynamoDB']

function deleteTable(tableName) {
  return new Promise((resolve, reject) => {
    let dynamoDB = dynamoose.aws.ddb();
    dynamoDB.deleteTable({ TableName: tableName }, (err, resp) => {
      if (err) {
        console.error(err);
      }
      console.log(resp);
    })
  })
}

Object.keys(models).forEach(modelName => {
  if (!includes(skipModels, modelName)) {
    promises.push(deleteTable(modelName))
  } else {
    logger.info(`Skipping ${modelName}`)
  }
})

Promise.all(promises)
  .then(() => {
    logger.info('All tables have been requested to be deleted. Deleting processes is run asynchronously')
    process.exit()
  })
  .catch((err) => {
    logger.logFullError(err)
    process.exit(1)
  })
