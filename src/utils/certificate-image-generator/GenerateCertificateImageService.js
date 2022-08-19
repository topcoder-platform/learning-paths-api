const fs = require('fs')
const queueHelper = require('../../common/queue-helper')

// read in the template and remove line breaks
const ssrTemplate = fs.readFileSync(`${__dirname}/ssr-certificate-template.html`, "utf-8")
    .replace(new RegExp('\r?\n', 'g'), '');


/**
 * Generates a certificate image asynchronously
 * @param {String} courseName The name of the course for which we are generating an image
 * @param {String} userId The ID of the user who completed the course
 * @param {Function} errorCallback The callback used when errors occur
 * @param {String} certificateUrl The URL for the certificate
 * @param {String} certificateElement The Element w/in the DOM of the certificate that 
 * should be converted to an image
 * @returns {Promise<void>}
 */
async function generateCertificateImageAsync(
    courseName,
    userId,
    errorCallback,
    certificateUrl,
    certificateElement,
) {
    const messageBody = {
        screenshotSelector: certificateElement,
        template: ssrTemplate,
        title: `Topcoder Academy ${courseName} for ${userId}`,
        url: certificateUrl,
    }

    await queueHelper.sendMessageAsync(
        'tca-certficate-generator',
        JSON.stringify(messageBody),
        messageBody.title,
        userId
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
