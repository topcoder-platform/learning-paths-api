/**
 * Initialize and export all model schemas.
 */

const config = require('config')
const dynamoose = require('dynamoose')

const awsConfigs = config.AMAZON.IS_LOCAL_DB ? {
  accessKeyId: config.AMAZON.LOCAL_AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AMAZON.LOCAL_AWS_SECRET_ACCESS_KEY,
  sessionToken: config.AMAZON.LOCAL_AWS_SESSION_TOKEN,
  region: config.AMAZON.AWS_REGION
} : {
  region: config.AMAZON.AWS_REGION
}

dynamoose.aws.sdk.config.update(awsConfigs)

if (config.AMAZON.IS_LOCAL_DB) {
  dynamoose.aws.ddb.local(config.AMAZON.DYNAMODB_URL)
}

dynamoose.model.defaults.set({
  create: true,
  update: false,
  waitForActive: false
})

module.exports = {
  Certification: dynamoose.model('Certification', require('./Certification')),
  CertificationProgress: dynamoose.model('CertificationProgress', require('./CertificationProgress')),
  Course: dynamoose.model('Course', require('./Course')),
  LearningResourceProvider: dynamoose.model('LearningResourceProvider', require('./LearningResourceProvider')),
}
