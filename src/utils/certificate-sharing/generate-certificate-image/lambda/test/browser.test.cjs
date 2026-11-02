const { test } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const { once } = require('node:events')
const { S3 } = require('@aws-sdk/client-s3')

test('certificate handler renders full-page and selected-element JPEGs with the packaged browser', async t => {
  const uploads = []
  const original = S3.prototype.putObject
  S3.prototype.putObject = async function (params) { uploads.push(params); return {} }
  t.after(() => { S3.prototype.putObject = original })
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.end('<!doctype html><html><body><main id="certificate" style="width:600px;height:300px;background:#eef"><h1>Fixture certificate</h1></main></body></html>')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const url = `http://127.0.0.1:${server.address().port}`
  const { index } = require('../handler')
  await assert.rejects(index({ Records: [] }), /must have a body/)
  for (const screenshotSelector of [undefined, '#certificate']) {
    await index({ Records: [{ body: JSON.stringify({ bucket: 'fixture', files: [{ path: 'certificate.jpg', url }], screenshotSelector }) }] })
  }
  assert.equal(uploads.length, 2)
  for (const upload of uploads) {
    assert.equal(upload.Bucket, 'fixture')
    assert.equal(upload.Key, 'certificate.jpg')
    assert.ok(upload.Body.length > 1000)
    assert.equal(upload.Body[0], 0xff)
    assert.equal(upload.Body[1], 0xd8)
  }
})
