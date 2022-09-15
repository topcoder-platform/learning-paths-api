// TODO: TCA-319 move this to the lambda function that serves the html
// const fs = require('fs')
const helper = require('../../common/helper')
const queueHelper = require('../../common/queue-helper')

/* TODO: TCA-319 move this to the lambda function that serves the html
// read in the template and remove line breaks
const ssrTemplate = fs.readFileSync(`${__dirname}/ssr-certificate-template.html`, "utf-8")
     .replace(new RegExp('\r?\n', 'g'), '');
*/

// Check the environment params on startup
const missingParam = [
    'CERT_BUCKET',
    'CERT_IMAGE_DOMAIN',
    'CERT_IMAGE_QUEUE',
    'CERT_IMAGE_SUBDOMAIN',
]
    .find(param => !process?.env?.[param])
if (!!missingParam) {
    throw new Error(`The ${missingParam} is not defined for the environment.`)
}

/**
 * Generates a certificate image asynchronously
 * 
 * @param {String} courseName The name of the course for which we are generating an image
 * @param {string} handle The handle of the user who completed the course
 * @param {String} certificateUrl The URL for the certificate
 * @param {String} certificateElement (optional) The Element w/in the DOM of the certificate that 
 * should be converted to an image
 * @returns {Promise<String>} filePath The path at which the new image is stored
 */
async function generateCertificateImageAsync(
    courseName,
    handle,
    certificateUrl,
    certificateElement,
) {

    // if we don't have all our info, we can't generate an image, so throw an error
    if (!certificateUrl || !handle || !courseName) {
        throw new Error(`One of these args is missing: certificate url (${certificateUrl})  handle (${handle})  courseName: ${courseName}`)
    }

    // construct the FQDN and file path of the location where the image will be created
    const imagePath = `certificate/${handle}/${courseName}.jpg`
    const imageUrl = `https://${process.env.CERT_IMAGE_SUBDOMAIN}.${process.env.CERT_IMAGE_DOMAIN}/${imagePath}`

    // if we don't have a valid URL, we have a problem
    if (!helper.isValidUrl(imageUrl)){
        throw new Error(`Image URL (${imageUrl}) is not a valid URL.`)
    }

    const messageBody = {
        bucket: process.env.CERT_BUCKET,
        filePath: imagePath,
        screenshotSelector: certificateElement,
        url: certificateUrl,
    }

    await queueHelper.sendMessageAsync(
        process.env.CERT_IMAGE_QUEUE,
        messageBody,
        `Creating Certificate Image: ${messageBody.filePath}`,
        handle,
    )

    return imageUrl
}

module.exports = {
    generateCertificateImageAsync,
}
