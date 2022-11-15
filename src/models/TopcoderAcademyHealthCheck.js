/**
 * This defines Course model
 */

const dynamoose = require('dynamoose')

const Schema = dynamoose.Schema

const schema = new Schema({
    id: {
        type: String,
        hashKey: true,
        required: true
    },
}, {
    throughput: { read: 2, write: 1 }
})

module.exports = schema
