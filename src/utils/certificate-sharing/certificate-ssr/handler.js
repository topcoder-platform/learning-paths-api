import fs from 'fs'
import urlExist from 'url-exist'

// load up the SSR Template when the function initializes
const ssrTemplate = fs.readFileSync(`./ssr-certificate-template.html`, "utf-8")
    .replace(new RegExp('\r?\n', 'g'), '');

export async function index(event) {

    try {

        // get the URL and title for the image
        let { certImageUrl, certTitle } = event?.queryStringParameters
        certImageUrl = await getCertImageUrl(certImageUrl)

        // insert the image and title into the template
        const html = ssrTemplate
            .replace(/\${certImageUrl}/g, certImageUrl)
            .replace(/\${certTitle}/g, certTitle || 'Topcoder Academy Certificate')

        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
            },
            body: html,
        };

        return response

    } catch (error) {

        // log the error and return it
        console.error(error)
        return {
            body: `${error}`,
            statusCode: 404,
        };
    }
};

export default index

/**
 * Gets the URL for the Cert Image
 *
 * Verifies the cert image actually exists
 * 
 * @param {Object} event The request
 * @returns {String} certImageUrl The verified URL of the cert Image
 */
async function getCertImageUrl(certImageUrlParam) {

    // validate the url 
    const certImageUrl = new URL(certImageUrlParam).toString()

    // verify the cert actually exists at that URL
    const certificateExists = await urlExist(certImageUrl)
    const existsMessage = `${certImageUrl} does${certificateExists ? '' : ' NOT'} exist`
    if (!certificateExists) {
        throw new Error(existsMessage)
    }

    // the cert image actually exists, so return its URL
    console.info(existsMessage)
    return certImageUrl
}

