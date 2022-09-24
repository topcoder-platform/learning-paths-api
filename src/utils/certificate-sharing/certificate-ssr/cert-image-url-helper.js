function getCertImageBaseUrl() {
    const imageBaseUrl = `https://${process.env.CERT_IMAGE_SUBDOMAIN}.${process.env.CERT_IMAGE_DOMAIN}`
    validateImageUrl(imageBaseUrl)
    return imageBaseUrl
}

function getCertImagePath(handle, certification) {
    return `certificate/${handle}/${certification}.jpg`
}

function getCertImageUrl(handle, certification) {
    const imageUrl = `${getCertImageBaseUrl()}/${getCertImagePath(handle, certification)}`
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
