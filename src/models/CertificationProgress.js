/**
 * This defines CertificationProgress model
 */

const dynamoose = require('dynamoose')
const ModuleProgress = require('./ModuleProgress')

const Schema = dynamoose.Schema

const schema = new Schema({
    id: {
        type: String,
        hashKey: true,
        required: true
    },
    certification: {
        type: String,
        rangeKey: true,
        required: true
    },
    certificationId: {
        type: String,
        required: true
    },
    courseKey: {
        type: String,
        required: true
    },
    courseId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true,
        index: {
            name: "userCertificationProgressIndex",
            global: true,
        }
    },
    provider: {
        type: String,
        required: true,
        index: {
            name: 'providerCertificationProgressIndex',
            global: true
        }
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
}, {
    timestamps: true,
    throughput: { read: 4, write: 2 }
})

module.exports = schema
