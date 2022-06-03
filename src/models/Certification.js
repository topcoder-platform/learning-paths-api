/**
 * This defines Certification model
 */

const dynamoose = require('dynamoose')

const Schema = dynamoose.Schema

const schema = new Schema({
    id: {
        type: String,
        hashKey: true,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    providerId: {
        type: String,
        required: true
    },
    providerName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    certification: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
},
    {
        throughput: { read: 4, write: 2 }
    })

module.exports = schema
