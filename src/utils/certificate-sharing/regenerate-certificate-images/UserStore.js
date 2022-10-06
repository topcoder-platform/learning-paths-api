const fetchUrl = require('node-fetch-commonjs')

const paramHelper = require('../env-param-helper')

// init the env vars on load
// TODO: figure out how to use a m2m token instead of an individual's
const {
    token,
} = paramHelper.initializeEnvironmentParams(
    [
        'CERT_REGENERATOR_TOKEN',
    ],
    [
        'token',
    ])

/**
 * Gets a user's handle from her/his user ID
 * 
 * @param {string} userId The ID of the user for whom we want a handle
 * @param {string} domain The domain of the environment we care about
 */
async function getHandleFromId(userId, domain) {

    const url = `https://api.${domain}/v3/users?fields=handle&filter=id=${userId}`
    const response = await fetchUrl(url, {
        method: 'GET',
        withCredentials: true,
        credentials: 'include',
        headers: {
            'Authorization': 'Bearer ' + token,
        }
    })

    if (response.status === 404) {
        console.error(`User ID ${userId} was not found. What??`)
        return undefined
    }

    let responseJson
    try {
        responseJson = await response.json()
        const handle = responseJson?.result?.content?.[0]?.handle
        if (!handle) {
            throw new Error(responseJson?.result?.content)
        }
        return handle

    } catch (error) {

        // if we found an error, just log it
        console.error(error)
        // console.debug('raw response', response)
        return undefined
    }
}

module.exports = {
    getHandleFromId,
}
