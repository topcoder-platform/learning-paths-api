/**
 * Initialize and export all model schemas.
 */

const config = require('config')
const dynamoose = require('dynamoose')

console.log("** Loading Dynamoose models...")

const awsConfigs = config.AMAZON.IS_LOCAL_DB ? {
  accessKeyId: config.AMAZON.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AMAZON.AWS_SECRET_ACCESS_KEY,
  sessionToken: config.AMAZON.AWS_SESSION_TOKEN,
  region: config.AMAZON.AWS_REGION
} : {
  region: config.AMAZON.AWS_REGION
}

// dynamoose.aws.sdk.config.update(awsConfigs)

if (config.AMAZON.IS_LOCAL_DB) {
  dynamoose.aws.ddb.local(config.AMAZON.DYNAMODB_URL)
}

console.log("AWS credentials: ",
  config.AMAZON.IS_LOCAL_DB,
  config.AMAZON.AWS_ACCESS_KEY_ID,
  config.AMAZON.AWS_SECRET_ACCESS_KEY)

console.log("Is local DB: " + config.AMAZON.IS_LOCAL_DB)
// console.log("DynamoDB URL: " + config.AMAZON.DYNAMODB_URL)
// console.log("AWS config", JSON.stringify(awsConfigs, null, 2))

console.log("Setting dynamoose model defaults...")
dynamoose.model.defaults.set({
  create: true,
  update: false,
  waitForActive: false
})
console.log("calling module.exports...")

module.exports = {
  Certification: dynamoose.model('Certification', require('./Certification')),
  CertificationProgress: dynamoose.model('CertificationProgress', require('./CertificationProgress')),
  Course: dynamoose.model('Course', require('./Course')),
  LearningResourceProvider: dynamoose.model('LearningResourceProvider', require('./LearningResourceProvider')),
}
