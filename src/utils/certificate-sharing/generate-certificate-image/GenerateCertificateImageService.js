const urlExists = require('url-exists')

const helper = require('../../../common/helper')
const imageHelper = require('../certificate-ssr/cert-image-url-helper')
const queueHelper = require('../../../common/queue-helper')

// Initialize the environment params on startup
function initializeEnvironmentParams() {

    const missingParam = [
        'CERT_BUCKET',
        'CERT_IMAGE_DOMAIN',
        'CERT_IMAGE_QUEUE',
        'CERT_IMAGE_SUBDOMAIN',
    ]
        .find(param => !process?.env?.[param])

    if (!!missingParam) {
        console.error(process.env)
        throw new Error(`The ${missingParam} is not defined for the environment.`)
    }

    return {
        bucket: process.env.CERT_BUCKET,
        imageBaseUrl: imageHelper.getCertImageBaseUrl(),
        queue: process.env.CERT_IMAGE_QUEUE,
    }
}
const {
    bucket,
    queue,
} = initializeEnvironmentParams()

/**
 * Generates a certificate image in a background thread
 *
 * Wraps an Async function, generateCertificateImageAsync, with a non-async function
 * so that the inner function happens in the background
 * 
 * @param {string} handle The handle of the user who completed the course
 * @param {String} certification The name of the certification for which we are generating an image
 * @param {string} provider The provider of the certificateion
 * @param {String} certificateUrl The URL for the certificate
 * @param {String} certificateElement (optional) The Element w/in the DOM of the certificate that 
 * should be converted to an image
 * @returns {void}
 */
function generateCertificateImage(
    handle,
    certification,
    provider,
    certificateUrl,
    certificateElement,
    progress,
) {

    // NOTE: This is an async function for which we are purposely NOT awaiting the response
    // so that it will complete in the background.
    // If any errors occur, those will be treated as unhandled errors that are okay bc they
    // occur in the background but will still be logged normally.
    generateCertificateImageAsync(
        handle,
        certification,
        provider,
        certificateUrl,
        certificateElement,
    )
        .then(async (imageUrl) => {
            console.info('Successfully queued generation of', imageUrl)
            await helper.update(progress, {
                certificationImageUrl: imageUrl
            })
            console.info('Successfully set progress.certificationImageUrl to', imageUrl)
        })
}

module.exports = {
    generateCertificateImage,
}
