const fs = require('fs')
const urlExists = require('url-exists')

const helper = require('./cert-image-url-helper')

// load up the SSR Template when the function initializes
const ssrTemplate = fs.readFileSync(`./ssr-certificate-template.html`, 'utf-8')
    .replace(new RegExp('\r?\n', 'g'), '');

exports.index = (event, context, callback) => {

    try {

        // get the URL and title for the image
        const { handle, certification, provider, title } = event?.pathParameters
        const certImageUrl = helper.getCertImageUrl(handle, provider, certification)
        // TODO TCA-598: Figure out a way to have shared configs so we don't 
        // need to hard-code this or go through all this rigamarole for the API
        // to get config info from the front end
        const certPreviewImageUrl = helper.getCertImageUrl(handle, provider, certification, 'large-container')

        // handle the request for the cert based on if its image actually exists
        urlExists(certImageUrl, handleCertRequest(certImageUrl, certPreviewImageUrl, title, callback))

    } catch (error) {
        handleError(callback, error)
    }
}

/**
 * Verifies the cert image actually exists then wraps it in SSR html
 * 
 * @param {String} certImageUrl The URL for the cert image
 * @param {String} certPreviewImageUrl The URL for the cert image that's used for previews
 * @param {String} certTitle The Title for the cert page
 * @param {Function} callback The Callback to use to return the async vals
 */
function handleCertRequest(certImageUrl, certPreviewImageUrl, certTitle, callback) {

    return (err, certificateExists) => {

        // if we got an error, we have a prob
        if (!!err) {
            console.error(`Checking existence of ${certImageUrl} caused ${err}`)
            handleError(callback, err)
            return
        }

        // verify the image exists
        if (!certificateExists) {
            handleError(callback, `This certificate ${certImageUrl} cannot be found.`, true)
            return
        }

        // the cert image actually exists, so insert the image and title into the template
        const existsMessage = `${certImageUrl} does exist`
        console.info(existsMessage)

        const html = ssrTemplate
            .replace(/\${certPreviewImageUrl}/g, certPreviewImageUrl)
            .replace(/\${certImageUrl}/g, certImageUrl)
            .replace(/\${certTitle}/g, certTitle || 'Topcoder Academy Certificate')

        // return the valid response
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
            },
            body: html,
        };

        callback(undefined, response)
    }
}

/**
 * Handles errors
 * 
 * @param {Function} callback The Callback to use to return the async vals
 * @param {String} message The Error Message
 * @param {Boolean} suppressError The flag to indicate if the error should
 * suppressed from bubbling up or not
 */
function handleError(callback, message, suppressError) {

    // log the error
    console.error(message)

    // return the error w/a 404, regardless of the type of error
    callback(suppressError ? undefined : message, {
        body: `${message}`,
        statusCode: 404,
    })
}
