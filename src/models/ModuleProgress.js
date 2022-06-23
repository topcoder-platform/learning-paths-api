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
    lessonCount: {
        type: Number,
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
},
    {
        throughput: { read: 4, write: 2 }
    })

module.exports = schema
