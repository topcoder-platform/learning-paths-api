function getCertImageBaseUrl() {
    const imageBaseUrl = `https://${process.env.CERT_IMAGE_SUBDOMAIN}.${process.env.CERT_IMAGE_DOMAIN}`
    validateImageUrl(imageBaseUrl)
    return imageBaseUrl
}

function getCertImagePath(handle, provider, certification, altName) {
    return `certificate/${handle}/${provider}/${certification}${!!altName ? `-${altName}`: ''}.jpg`
}

function getCertImageUrl(handle, provider, certification, altName) {
    const imageUrl = `${getCertImageBaseUrl()}/${getCertImagePath(handle, provider, certification, altName)}`
    validateImageUrl(imageUrl)
    return imageUrl
}

function validateImageUrl(url) {
    try {
        new URL(url)
    } catch (error) {
        throw new Error(`Image URL (${url}) is not a valid URL.`)
    }
}

module.exports = {
    getCertImageBaseUrl,
    getCertImagePath,
    getCertImageUrl,
}
