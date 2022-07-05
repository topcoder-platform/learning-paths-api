/**
 * Drop tables in database. All data will be cleared.
 */

const dynamoose = require('dynamoose')
const models = require('../models')
const { includes } = require('lodash')
const logger = require('../common/logger')

logger.info('Requesting to delete table(s)...')

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

// Handle dropping all model tables, or a specific one 
// if the user provides a model name
let deleteModels = [];
if (process.argv.length === 2) {
  deleteModels = Object.keys(models)
} else if (process.argv.length === 3) {
  deleteModels.push(process.argv[2])
}

deleteModels.forEach(modelName => {
  if (!includes(skipModels, modelName)) {
    promises.push(deleteTable(modelName))
  } else {
    logger.info(`Skipping ${modelName}`)
  }
})

Promise.all(promises)
  .then(() => {
    if (deleteModels.length > 1) {
      logger.info('All tables have been requested to be deleted. Deleting processes is run asynchronously')
    } else {
      logger.info(`The ${deleteModels[0]} table has been requested to be deleted. Deletion runs asynchronously`)
    }
    process.exit()
  })
  .catch((err) => {
    logger.logFullError(err)
    process.exit(1)
  })
