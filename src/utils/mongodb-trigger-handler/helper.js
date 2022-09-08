/**
 * This file defines helper methods
 */

const _ = require('lodash')
const config = require('config')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE']))

/**
 * Get a machine-to-machine auth token.
 * 
 * @returns {Promise<String>} the M2M token
 */
async function getM2MToken() {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

module.exports = {
  getM2MToken
}
