const http = require('http')
const https = require('https')

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
    let url

    try {
        url = new URL(value)
    } catch (error) {
        callback(error, false)
        return
    }

    const client = url.protocol === 'https:' ? https : url.protocol === 'http:' ? http : undefined
    if (!client) {
        callback(new Error('Only HTTP and HTTPS URLs are supported'), false)
        return
    }

    const request = client.request(url, {
        method: 'HEAD',
        timeout: REQUEST_TIMEOUT_MS,
    }, response => {
        response.resume()

        const isRedirect = response.statusCode >= 300 && response.statusCode < 400
        if (isRedirect && response.headers.location) {
            if (redirectCount >= MAX_REDIRECTS) {
                callback(new Error('Too many redirects while checking URL'), false)
                return
            }

            urlExists(new URL(response.headers.location, url).toString(), callback, redirectCount + 1)
            return
        }

        callback(undefined, response.statusCode >= 200 && response.statusCode < 400)
    })

    request.once('timeout', () => request.destroy(new Error('URL check timed out')))
    request.once('error', error => callback(error, false))
    request.end()
}

module.exports = urlExists
