const fs = require('fs')
const queueHelper = require('../../common/queue-helper')

// read in the template and remove line breaks
const ssrTemplate = fs.readFileSync(`${__dirname}/ssr-certificate-template.html`, "utf-8")
    .replace(new RegExp('\r?\n', 'g'), '');

/**
 * Generates a certificate image asynchronously
 * 
 * @param {String} courseName The name of the course for which we are generating an image
 * @param {String} handle The handle of the user who completed the course
 * @param {Function} errorCallback The callback used when errors occur
 * @param {String} certificateUrl The URL for the certificate
 * @param {String} certificateElement (optional) The Element w/in the DOM of the certificate that 
 * should be converted to an image
 * @returns {Promise<void>}
 */
async function generateCertificateImageAsync(
    courseName,
    handle,
    errorCallback,
    certificateUrl,
    certificateElement,
) {

    // if we don't have a cert URL, we can't generate an image, so just return
    if (!certificateUrl) {
        return
    }

    // if we don't have a queue name, we have a problem
    if (!process.env.CERT_IMAGE_QUEUE) {
        throw new Error('The CERT_IMAGE_QUEUE is not defined for the environment.')
    }

    const messageBody = {
        screenshotSelector: certificateElement,
        template: ssrTemplate,
        title: `Topcoder Academy ${courseName} for ${handle}`,
        url: certificateUrl,
    }

    await queueHelper.sendMessageAsync(
        process.env.CERT_IMAGE_QUEUE,
        JSON.stringify(messageBody),
        messageBody.title,
        handle
    )
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
