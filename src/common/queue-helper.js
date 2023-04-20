const config = require('config');
const { SendMessageCommand, SQSClient } = require("@aws-sdk/client-sqs");

/**
 * Sends a message to a queue async
 * @param {String} queueUrl The full URL of the queue to which to send the message
 * @param {Object} body The body of the message that will be sent to the queue
 * @param {String} title The title of the message
 * @param {String} author The author of the message
 * @returns {Promise<void>}
 */
async function sendMessageAsync(queueUrl, body, title, author) {

    const REGION = config.AMAZON.AWS_REGION;
    const sqsClient = new SQSClient({ region: REGION });

    const params = {
        DelaySeconds: 10,
        MessageAttributes: {
            Title: {
                DataType: 'String',
                StringValue: title
            },
            Author: {
                DataType: 'String',
                StringValue: author
            },
        },
        MessageBody: JSON.stringify(body),
        QueueUrl: queueUrl,
    };

    //return sqs.sendMessage(params);
    const run = async () => {
        try {
            const data = await sqsClient.send(new SendMessageCommand(params));
            return data; // For unit tests.
        } catch (err) {
            console.log("Error sending message to sqs", err);
        }
    };
    run();
}

module.exports = {
    sendMessageAsync,
}
