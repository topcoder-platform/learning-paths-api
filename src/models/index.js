/**
 * Initialize and export all model schemas.
 */

const config = require('config')
const dynamoose = require('dynamoose')

// NOTE! We are using AWS config vars here prefixed with LOCAL_ because 
// Dynamoose internally uses the aws-sdk and it will blindly 
// use any existing AWS env vars despite the call to  
// dynamoose.aws.sdk.config.update(). 
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

// console.log(JSON.stringify(dynamoose.aws.sdk.config))

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
