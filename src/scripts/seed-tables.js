/**
 * Insert seed data into tables in database
 */

const { get, includes } = require('lodash')
const models = require('../models')
const logger = require('../common/logger')

logger.info('Requesting to insert seed data to the tables...')

const promises = []
const skipModels = []
let seedModels = []

// Handle seeding all model tables, or a specific one 
// if the user provides a model name
if (process.argv.length === 2) {
  seedModels = Object.keys(models)
} else if (process.argv.length === 3) {
  seedModels.push(process.argv[2])
}

seedModels.forEach(modelName => {
  if (includes(skipModels, modelName)) {
    logger.warn(`Skipping Seed Model ${modelName}`)
    return
  }
  try {
    const data = require(`./seed/${modelName}.json`)
    logger.info(`Inserting ${get(data, 'length')} records in table ${modelName}`)
    promises.push(models[modelName].batchPut(data))
  } catch (e) {
    logger.warn(`No records will be inserted in table ${modelName}`)
  }
})

Promise.all(promises)
  .then(() => {
    if (seedModels.length > 1) {
      logger.info('All tables have been inserted with the data. The processes is run asynchronously.')
    } else {
      logger.info(`Seeding of the ${seedModels[0]} table has started. The process runs asynchronously.`)
    }
    process.exit()
  })
  .catch((err) => {
    logger.logFullError(err)
    process.exit(1)
  })
