const { postBusEvent } = require("../common/helper")

/**
 * Post message to TC-BUS Kafka
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function postTCBusMessageHandler(req, res) {
    const eventResponse = await postBusEvent(req.body.topic, req.body.payload);

    res.send(eventResponse.text);
}


module.exports = {
    postTCBusMessageHandler
}
