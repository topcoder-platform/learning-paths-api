const AWS = require('aws-sdk');

// Set the region 
AWS.config.update({
    region: 'us-east-1'
});

// Create an SQS service object
const sqs = new AWS.SQS();

async function sendMessageAsync(queue, messageBody, messageTitle, messageAuthor) {

    const params = {
        DelaySeconds: 10,
        MessageAttributes: {
            'Title': {
                DataType: 'String',
                StringValue: messageTitle
            },
            'Author': {
                DataType: 'String',
                StringValue: messageAuthor
            },
        },
        MessageBody: JSON.stringify(messageBody),
        QueueUrl: `${process.env.QUEUE_URL}${queue}`,
    };

    return sqs.sendMessage(params)
        .promise()
}

module.exports = {
    sendMessageAsync,
}
