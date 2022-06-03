/**
 * Initialize database tables. All data will be cleared.
 */
require('../app-bootstrap')
const logger = require('./common/logger')
const helper = require('./common/helper')

logger.info('Initialize database.')

const initDB = async () => {
  const certifications = await helper.scan('Certification')
  for (const certification of certifications) {
    await certification.delete()
  }
  const courses = await helper.scan('Course')
  for (const course of courses) {
    await course.delete()
  }
  const providers = await helper.scan('LearningResourceProvider')
  for (const provider of providers) {
    await provider.delete()
  }
}

initDB().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit(1)
})
