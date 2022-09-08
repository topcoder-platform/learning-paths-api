const fs = require('fs')
const queueHelper = require('../../common/queue-helper')

// read in the template and remove line breaks
const ssrTemplate = fs.readFileSync(`${__dirname}/ssr-certificate-template.html`, "utf-8")
    .replace(new RegExp('\r?\n', 'g'), '');

/**
 * Generates a certificate image asynchronously
 * 
 * @param {String} courseName The name of the course for which we are generating an image
 * @param {string} handle The handle of the user who completed the course
 * @param {String} certificateUrl The URL for the certificate
 * @param {Function} errorCallback The callback used when errors occur
 * @param {String} certificateElement (optional) The Element w/in the DOM of the certificate that 
 * should be converted to an image
 * @returns {Promise<void>}
 */
async function generateCertificateImageAsync(
    courseName,
    handle,
    certificateUrl,
    errorCallback,
    certificateElement,
) {

    // if we don't have all our info, we can't generate an image, so just return
    if (!certificateUrl || !handle || !courseName) {
        throw new Error(`One of these args is missing: certificate url (${certificateUrl})  handle (${handle})  courseName: ${courseName}`)
    }

    // if we don't have a queue name, we have a problem
    if (!process.env.CERT_IMAGE_QUEUE) {
        throw new Error('The CERT_IMAGE_QUEUE is not defined for the environment.')
    }

    if (!process.env.CERT_BUCKET) {
        throw new Error('The CERT_BUCKET is not defined for the environment.')
    }

    const messageBody = {
        bucket: process.env.CERT_BUCKET,
        filePath: `certificate/${handle}/${courseName}.jpg`,
        screenshotSelector: certificateElement,
        url: certificateUrl,
    }

    console.debug(messageBody)
    await queueHelper.sendMessageAsync(
        process.env.CERT_IMAGE_QUEUE,
        JSON.stringify(messageBody),
        `Creating Certificate Image: ${messageBody.filePath}`,
        handle,
    )
        .then(() => {
            return messageBody.filePath
        })
        .catch(err => {
            if (!!errorCallback) {
                errorCallback(err)
            } else {
                throw err
            }
        })
}

module.exports = {
    generateCertificateImageAsync,
}
