/**
 * Initialize and export all model schemas.
 */

const config = require('config')
const dynamoose = require('dynamoose')

const awsConfigs = config.AMAZON.IS_LOCAL_DB ? {
  accessKeyId: config.AMAZON.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AMAZON.AWS_SECRET_ACCESS_KEY,
  sessionToken: config.AMAZON.AWS_SESSION_TOKEN,
  region: config.AMAZON.AWS_REGION
} : {
  region: config.AMAZON.AWS_REGION
}


dynamoose.AWS.config.update(awsConfigs)

if (config.AMAZON.IS_LOCAL_DB) {
  dynamoose.local(config.AMAZON.DYNAMODB_URL)
}

// console.log(config.AMAZON.IS_LOCAL_DB, config.AMAZON.AWS_ACCESS_KEY_ID, config.AMAZON.AWS_SECRET_ACCESS_KEY)
// console.log("Is local DB" + config.AMAZON.IS_LOCAL_DB )
// console.log("AWS config" + JSON.stringify(awsConfigs) )
// console.log(JSON.stringify(dynamoose.AWS.config))

dynamoose.setDefaults({
  create: false,
  update: false,
  waitForActive: false
})

module.exports = {
  Certification: dynamoose.model('Certification', require('./Certification')),
  Course: dynamoose.model('Course', require('./Course')),
  LearningResourceProvider: dynamoose.model('LearningResourceProvider', require('./LearningResourceProvider')),
}
