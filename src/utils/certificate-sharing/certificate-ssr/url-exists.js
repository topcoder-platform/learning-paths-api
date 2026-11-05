const https = require('https')

const imageUrlHelper = require('./cert-image-url-helper')

const CERTIFICATE_PATH_PREFIX = '/certificate/'
const MAX_REDIRECTS = 5
const REQUEST_TIMEOUT_MS = 5000

/**
 * Checks whether an HTTP(S) URL is reachable without the deprecated request
 * dependency tree previously pulled in by url-exists.
 *
 * @param {string} value URL to check
 * @param {Function} callback Node-style callback receiving (error, exists)
 * @param {number} redirectCount Number of redirects already followed
 * @returns {void}
 */
function urlExists(value, callback, redirectCount = 0) {
    let requestUrl
    let trustedOrigin

    try {
        requestUrl = new URL(value)
        trustedOrigin = new URL(imageUrlHelper.getCertImageBaseUrl())
    } catch (error) {
        callback(error, false)
        return
    }

    const hasUntrustedTarget = requestUrl.origin !== trustedOrigin.origin
        || !requestUrl.pathname.startsWith(CERTIFICATE_PATH_PREFIX)
        || !!requestUrl.username
        || !!requestUrl.password
        || !!requestUrl.search

    if (hasUntrustedTarget) {
        callback(new Error('Certificate image URL uses an untrusted target'), false)
        return
    }

    // Keep the network destination separate from the request-derived path. The
    // trusted origin is always supplied as the URL argument, while the path can
    // only select an object on that origin.
    const request = https.request(trustedOrigin, {
        method: 'HEAD',
        path: `${requestUrl.pathname}${requestUrl.search}`,
        timeout: REQUEST_TIMEOUT_MS,
    }, response => {
        response.resume()

        const isRedirect = response.statusCode >= 300 && response.statusCode < 400
        if (isRedirect && response.headers.location) {
            if (redirectCount >= MAX_REDIRECTS) {
                callback(new Error('Too many redirects while checking URL'), false)
                return
            }

            let redirectUrl
            try {
                redirectUrl = new URL(response.headers.location, requestUrl)
            } catch (error) {
                callback(error, false)
                return
            }

            urlExists(
                redirectUrl.toString(),
                callback,
                redirectCount + 1,
            )
            return
        }

        callback(undefined, response.statusCode >= 200 && response.statusCode < 400)
    })

    request.once('timeout', () => request.destroy(new Error('URL check timed out')))
    request.once('error', error => callback(error, false))
    request.end()
}

module.exports = urlExists
