/**
 * Create table schemes in database
 */

const models = require('../models')
const { includes } = require('lodash')
const logger = require('../common/logger')

logger.info('Requesting to create tables...')

const promises = []
const skipModels = []
let createModels = []

// Handle creating all model tables, or a specific one 
// if the user provides a model name
if (process.argv.length === 2) {
  createModels = Object.keys(models)
} else if (process.argv.length === 3) {
  createModels.push(process.argv[2])
}

createModels.forEach(modelName => {
  if (!includes(skipModels, modelName)) {
    promises.push(models[modelName].table.create.request())
  } else {
    logger.info(`Skipping ${modelName}`)
  }
})

Promise.all(promises)
  .then(() => {
    if (createModels.length > 1) {
      logger.info('All tables have been requested to be created. Creating processes is run asynchronously.')
    } else {
      logger.info(`The ${createModels[0]} table has been requested to be created. Creation runs asynchronously.`)
    }
    process.exit()
  })
  .catch((err) => {
    logger.logFullError(err)
    process.exit(1)
  })
