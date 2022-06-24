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
        enum: ["in-progress", "completed"],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    completedDate: {
        type: Date,
        required: false
    },
    currentLesson: {
        type: String,
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
