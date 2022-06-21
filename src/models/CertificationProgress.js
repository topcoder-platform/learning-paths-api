/**
 * This defines CertificationProgress model
 */

const dynamoose = require('dynamoose')
const ModuleProgress = require('./ModuleProgress')

const Schema = dynamoose.Schema

const schema = new Schema({
    userId: {
        type: String,
        hashKey: true,
        required: true
    },
    certification: {
        type: String,
        rangeKey: true,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    currentLesson: {
        type: String,
        required: true
    },
    percentCompleted: {
        type: Number,
        required: true
    },
    modules: {
        type: Array,
        schema: [ModuleProgress],
        required: true
    }
},
    {
        throughput: { read: 4, write: 2 }
    })

module.exports = schema
