/**
 * Insert seed data to tables in database
 */

const { get, includes } = require('lodash')
const models = require('../models')
const logger = require('../common/logger')

logger.info('Requesting to insert seed data to the tables...')

// async function seedData() {
// const data = require('./seed/Certification.json')
// const result = await Certification.batchPut(data);

// console.log(result);

//   const modelNames = Object.keys(models)

//   for (const modelName of modelNames) {
//     if (includes(skipModels, modelName)) {
//       logger.warn(`Skipping Seed Model ${modelName}`)
//       return
//     }
//     try {
//       const data = require(`./seed/${modelName}.json`)
//       logger.info(`Inserting ${get(data, 'length')} records in table ${modelName}`)
//       const result = await models[modelName].batchPut(data)
//       console.log(result)
//     } catch (e) {
//       logger.warn(`No records will be inserted in table ${modelName}, error: ${e}`)
//     }
//   }
// }

// seedData()

const promises = []
const skipModels = []

Object.keys(models).forEach(modelName => {
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
    logger.info('All tables have been inserted with the data. The processes is run asynchronously')
    process.exit()
  })
  .catch((err) => {
    logger.logFullError(err)
    process.exit(1)
  })
