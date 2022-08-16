/**
 * This defines the Module model, which is embedded in 
 * the Course model and not persisted separately
 */

const dynamoose = require('dynamoose')

const Schema = dynamoose.Schema

const schema = new Schema({
    key: {
        type: String,
        required: true
    },
    meta: {
        type: Object,
        schema: {
            name: {
                type: String,
                required: true
            },
            dashedName: {
                type: String,
                required: true
            },
            estimatedCompletionTime: {
                type: Object,
                schema: {
                    value: {
                        type: Number,
                        required: true
                    },
                    units: {
                        type: String,
                        required: true
                    }
                }
            },
            introCopy: {
                type: Array,
                schema: [String],
                required: false,
                default: []
            }
        },
        required: true
    },
    lessons: {
        type: Array,
        schema: [{
            type: Object,
            schema: {
                id: {
                    type: String,
                    required: false,
                },
                title: {
                    type: String,
                    required: true
                },
                dashedName: {
                    type: String,
                    required: true
                }
            }
        }]
    }
},
    {
        throughput: { read: 4, write: 2 }
    })

module.exports = schema
