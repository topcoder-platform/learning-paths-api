/**
 * This defines Course model
 */

const dynamoose = require('dynamoose')
const Module = require('./Module')

const Schema = dynamoose.Schema

const schema = new Schema({
  id: {
    type: String,
    hashKey: true,
    required: true
  },
  provider: {
    type: String,
    rangeKey: true,
    required: true,
    index: {
      name: "provider-key-index",
      global: true,
    }
  },
  providerId: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  certificationId: {
    type: String,
    required: true
  },
  certification: {
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
    required: false
  },
  keyPoints: {
    type: Array,
    schema: [String],
    required: false
  },
  completionSuggestions: {
    type: Array,
    schema: [String],
    required: false
  },
  note: {
    type: String,
    required: false,
  },
  modules: {
    type: Array,
    schema: [Module],
    required: true
  }
}, {
  timestamps: true,
  throughput: { read: 4, write: 2 }
})

module.exports = schema
