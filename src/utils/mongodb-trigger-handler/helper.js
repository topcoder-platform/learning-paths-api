/**
 * This file defines helper methods
 */

const config = require('config')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(config)

/**
 * Obtain a verified, cached Keycloak service token using configured credentials.
 * Takes no arguments; rejects sanitized shared-core issuance/validation errors.
 * 
 * @returns {Promise<String>} the M2M token
 */
async function getM2MToken() {
  return m2m.getMachineToken()
}

module.exports = {
  getM2MToken
}
