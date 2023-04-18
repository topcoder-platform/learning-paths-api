const helper = require('../../../common/helper')
const imageHelper = require('../certificate-ssr/cert-image-url-helper')
const paramHelper = require('../env-param-helper')
const queueHelper = require('../../../common/queue-helper').default

// Initialize the environment params on startup
const {
    bucket,
    queue,
} = paramHelper.initializeEnvironmentParams(
    [
        'CERT_BUCKET',
        'CERT_IMAGE_DOMAIN',
        'CERT_IMAGE_QUEUE',
        'CERT_IMAGE_SUBDOMAIN',
    ],
    [
        'bucket',
        'imageDomain',
        'queue',
        'imageSubdomain',
    ]
)

/**
 * Generates a certificate image in a background thread
 *
 * Wraps an Async function, generateCertificateImageAsync, with a non-async function
 * so that the inner function happens in the background
 * 
 * @param {Object | undefined} progress The Certificate Progress record for which the cert is being generated
 * @param {string} handle The handle of the user who completed the course
 * @param {String} certification The name of the certification for which we are generating an image
 * @param {string} provider The provider of the certificateion
 * @param {String} certificateUrl The URL for the certificate
 * @param {String} certificateElement (optional) The Element w/in the DOM of the certificate that 
 * should be converted to an image
 * @param {Object} certificateAlternateParams (optional) If there are any alternate params,
 * they will be added to the list of image files that will be created.
 * @returns {void}
 */
function generateCertificateImage(
    progress,
    handle,
    certification,
    provider,
    certificateUrl,
    certificateElement,
    certificateAlternateParams,
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
        certificateAlternateParams,
    )
        .then(async (imageUrl) => {
            console.info('Successfully queued generation of', imageUrl)
            if (progress) {
                await helper.update(progress, {
                    certificationImageUrl: imageUrl
                })
                console.info('Successfully set progress.certificationImageUrl to', imageUrl)
            }
        })
}

/**
 * Generates a certificate image asynchronously
 * 
 * @param {string} handle The handle of the user who completed the course
 * @param {String} certificationName The name of the certification for which we are generating an image
 * @param {string} provider The provider of the certification
 * @param {String} certificateUrl The URL for the certificate
 * @param {String} certificateElement (optional) The Element w/in the DOM of the certificate that 
 * @param {Object} certificateAlternateParams (optional) If there are any alternate params,
 * they will be added to the list of image files that will be created.
 * E.g. 
 * {
 *     "view-style": "large-container",
 * }
 * @returns {Promise<String>} The URL at which the new image can be found
 */
async function generateCertificateImageAsync(
    handle,
    certificationName,
    provider,
    certificateUrl,
    certificateElement,
    certificateAlternateParams,
) {

    // if we don't have all our info, we can't generate an image, so throw an error
    if (!certificateUrl || !handle || !certificationName || !provider) {
        const err = `One of these args is missing: certificate url (${certificateUrl})  handle (${handle})  provider: (${provider})  certificationName: (${certificationName})`
        console.error(err)
        throw new Error(err)
    }

    // construct the FQDN and file path of the location where the image will be created
    const imageUrl = imageHelper.getCertImageUrl(handle, provider, certificationName)
    const files = [
        {
            path: imageHelper.getCertImagePath(handle, provider, certificationName),
            url: certificateUrl,
        },
    ]

    // if there are alt params, add those versions of the list of files to be created
    if (!!certificateAlternateParams) {
        Object.keys(certificateAlternateParams)
            ?.map(key => {
                const value = certificateAlternateParams[key]
                return ({
                    path: imageHelper.getCertImagePath(handle, provider, certificationName, value),
                    url: `${certificateUrl}?${new URLSearchParams({ [key]: value })}`
                })
            })
            .forEach(param => files.push(param))
    }

    console.log('Generating', files)

    // construct the msg body
    const messageBody = {
        bucket,
        files,
        screenshotSelector: certificateElement,
    }

    await queueHelper.sendMessageAsync(
        queue,
        messageBody,
        `Creating Certificate Image: ${imageUrl}`,
        handle,
    )

    return imageUrl
}

module.exports = {
    generateCertificateImage,
}
