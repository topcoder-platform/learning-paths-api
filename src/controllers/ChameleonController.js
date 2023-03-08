/**
 * Controller for certification endpoints
 */
const service = require('../services/ChameleonService')
// const helper = require('../common/helper')

/**
 * Get user hash data for the chameleon service
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getHashedUid(req, res) {
    const result = await service.getHashedUid(req.query.uuId)
    res.send(result)
}

module.exports = {
    getHashedUid,
}
