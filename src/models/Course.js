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
  provider: {
    type: String,
    required: true
  },
  key: {
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
  introCopy: {
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
    required: true,
  }
},
  {
    throughput: { read: 4, write: 2 }
  })

module.exports = schema
