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

        // handle the request for the cert based on if its image actually exists
        urlExists(certImageUrl, handleCertRequest(certImageUrl, title, callback))

    } catch (error) {

        // log the error and return it
        console.error(error)
        callback(error, {
            body: `${error}`,
            statusCode: 404,
        })
    }
}

/**
 * Verifies the cert image actually exists then wraps it in SSR html
 * 
 * @param {String} certImageUrl The URL for the cert image
 * @param {String} certTitle The Title for the cert page
 * @param {Function} callback The Callback to use to return the async vals
 */
function handleCertRequest(certImageUrl, certTitle, callback) {

    return (err, certificateExists) => {

        // if we got an error, we have a prob
        if (!!err) {
            console.error(`Checking existence of ${certImageUrl} caused ${err}`)
            callback(err)
        }

        // verify the image exists
        const existsMessage = `${certImageUrl} does${certificateExists ? '' : ' NOT'} exist`
        if (!certificateExists) {
            callback(existsMessage)
        }

        // the cert image actually exists, so insert the image and title into the template
        console.info(existsMessage)

        const html = ssrTemplate
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
