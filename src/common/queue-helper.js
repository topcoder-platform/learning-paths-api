const AWS = require('aws-sdk');

// create an SQS service object
const sqs = new AWS.SQS()

// TCA-57 temporarily print user to troubleshoot
// access issue
const iam = new AWS.IAM()
console.log("********** user", iam.getUser())

/**
 * Sends a message to a queue async
 * @param {String} queueName The queue to which to send the message
 * @param {Object} body The body of the message that will be sent to the queue
 * @param {String} title The title of the message
 * @param {String} author The author of the message
 * @returns {Promise<void>}
 */
async function sendMessageAsync(queueName, body, title, author) {

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
        QueueUrl: `${process.env.QUEUE_URL}${queueName}`,
    };

    console.log('####### queue URL', params.QueueUrl)

    return sqs.sendMessage(params)
        .promise()
}

module.exports = {
    sendMessageAsync,
}
