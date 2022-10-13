const fetchUrl = require('node-fetch-commonjs')

/**
 * Gets a user's handle from her/his user ID
 * 
 * @param {string} userId The ID of the user for whom we want a handle
 * @param {string} domain The domain of the environment we care about
 */
async function getHandleFromId(userId, domain) {

    const url = `https://api.${domain}/v5/members?userId=${userId}`
    const response = await fetchUrl(url, {
        method: 'GET',
    })

    if (response.status === 404) {
        console.error(`User ID ${userId} was not found. What??`)
        return undefined
    }

    let responseJson
    try {
        responseJson = await response.json()
        const handle = responseJson?.[0]?.handle
        if (!handle) {
            throw new Error(responseJson?.[0])
        }
        return handle

    } catch (error) {

        // if we found an error, just log it
        console.error('Error getting handle:', error)
        // console.debug('raw response', response)
        return undefined
    }
}

module.exports = {
    getHandleFromId,
}
