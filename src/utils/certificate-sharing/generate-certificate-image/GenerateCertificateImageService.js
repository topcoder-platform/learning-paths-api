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
 * Generates All the Certifications that don't exist
 */
async function generateAllMissingAsync() {

    const certificationProgresses = await helper.scanAll('CertificationProgress')
    console.log(`Found ${certificationProgresses.length} progress records.`)

    // filter data to only completed courses
    const completedCertifications = certificationProgresses
        .filter(certProgress => certProgress.status === 'completed')
    console.log(`Found ${completedCertifications.length} completed progress records.`)

    // get the list of completed courses that never had an image generated
    const newImages = completedCertifications
        .filter(certProgress => !certProgress.certificationImageUrl)
    console.log(`Found ${newImages.length} completed courses that never had an image generated.`)

    // get the list of completed courses that did have an image created
    // but that image doesn't exist
    const missingImages = []
    completedCertifications
        .filter(certProgress => !!certProgress.certificationImageUrl)
        .forEach(async (certProgress) => {
            urlExists(certProgress.certificationImageUrl)
            handleImageUrlExistsRequestAsync(certProgress, certImageExistsCallback)
        })

    console.log('new', newImages)
    console.log('missing', missingImages)
}

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

/**
 * Generates a certificate image asynchronously
 * 
 * @param {string} handle The handle of the user who completed the course
 * @param {String} certificationName The name of the certification for which we are generating an image
 * @param {string} provider The provider of the certification
 * @param {String} certificateUrl The URL for the certificate
 * @param {String} certificateElement (optional) The Element w/in the DOM of the certificate that 
 * should be converted to an image
 * @returns {Promise<String>} The URL at which the new image can be found
 */
async function generateCertificateImageAsync(
    handle,
    certificationName,
    provider,
    certificateUrl,
    certificateElement,
) {

    // if we don't have all our info, we can't generate an image, so throw an error
    if (!certificateUrl || !handle || !certificationName || !provider) {
        const err = `One of these args is missing: certificate url (${certificateUrl})  handle (${handle})  provider: (${provider})  certificationName: (${certificationName})`
        console.error(err)
        throw new Error(err)
    }

    // construct the FQDN and file path of the location where the image will be created
    const imageUrl = imageHelper.getCertImageUrl(handle, provider, certificationName)
    const messageBody = {
        bucket,
        filePath: imageHelper.getCertImagePath(handle, provider, certificationName),
        screenshotSelector: certificateElement,
        url: certificateUrl,
    }

    await queueHelper.sendMessageAsync(
        queue,
        messageBody,
        `Creating Certificate Image: ${messageBody.filePath}`,
        handle,
    )

    return imageUrl
}

async function handleImageUrlExistsRequestAsync(certProgress, missingCertImageProgress) {

    return (err, certificateExists) => {

        // if we got an error, we have a prob
        if (!!err) {
            console.error(`Checking existence of ${certProgress.certificationImageUrl} caused ${err}`)
            return
        }

        // if the image exists, don't do anything
        if (certificateExists) {
            console.log(`${certProgress.certificationImageUrl} exists. Moving on.`)
            return
        }

        console.log(`${certProgress.certificationImageUrl} does NOT exist. Adding to the missing images list.`)
        missingImages.push(missingCertImageProgress)
    }
}

module.exports = {
    generateAllMissingAsync,
    generateCertificateImage,
}
