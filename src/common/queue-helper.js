const AWS = require('aws-sdk');

// Set the region 
AWS.config.update({
    region: 'us-east-1'
});

// Create an SQS service object
const sqs = new AWS.SQS();

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

    return sqs.sendMessage(params)
        .promise()
}

module.exports = {
    sendMessageAsync,
}
