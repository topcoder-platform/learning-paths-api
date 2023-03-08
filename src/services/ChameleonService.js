const crypto = require('crypto');
const { CHAMELEON_VERIFICATION_SECRET } = process.env;

/**
 * Hashes uid param with chameleon's verification secret
 * @param {string} uid String to hash
 * @returns { uid_hash } hashed uid
 */
function getHashedUid(uid) {
  // Retrieve the secret from the environment variables
  const secret = CHAMELEON_VERIFICATION_SECRET;
  
  // Generate the current UNIX timestamp in seconds
  const now = Math.floor(Date.now() / 1000);
  
  // Generate the UID hash using the UID, secret, and current timestamp
  const uid_hash = [crypto.createHmac('sha256', secret).update(`${uid}-${now}`).digest('hex'), now].join('-');

  return { uid_hash };
}

module.exports = {
    getHashedUid,
};
