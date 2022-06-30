/**
 * This defines ModuleProgress model
 */

const dynamoose = require('dynamoose')

const Schema = dynamoose.Schema

const schema = new Schema({
    module: {
        type: String,
        required: true
    },
    moduleStatus: {
        type: String,
        enum: ["not-started", "in-progress", "completed"],
        required: true
    },
    lessonCount: {
        type: Number,
        default: 0,
        required: true
    },
    completedLessons: {
        type: Array,
        schema: [{
            type: Object,
            schema: {
                dashedName: {
                    type: String,
                    default: null
                },
                completedDate: {
                    type: Date,
                    default: null
                }
            }
        }]
    }
}, {
    throughput: { read: 4, write: 2 }
})

module.exports = schema
