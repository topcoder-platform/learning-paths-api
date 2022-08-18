const fs = require('fs')
const queueHelper = require('../../common/queue-helper')

// read in the template and remove line breaks
const ssrTemplate = fs.readFileSync(`${__dirname}/ssr-certificate-template.html`, "utf-8")
    .replace(new RegExp('\r?\n', 'g'), '');

async function generateCertificateImageAsync(courseId, courseName, userId, errorCallback) {

    // construct the URL for the cert for which we are generating the image
    const certificateUrl = `${process.env.PLATFORM_URL}/learn/freeCodeCamp/${courseId}/${userId}/certificate`

    // TODO: figure out how to not hard-code the selector for the screenshot element
    const messageBody = {
        screenshotSelector: "[class^=Certificate_wrap]",
        template: ssrTemplate,
        title: `Topcoder Academy ${courseName} for ${userId}`,
        url: certificateUrl,
    }


    // this is an async function for which we are purposely not
    // waiting for the response
    await queueHelper.sendMessageAsync(
        'tca-certficate-generator',
        JSON.stringify(messageBody),
        messageBody.title,
        userId
    )
        .catch(err => {
            if (!!errorCallback) {
                errorCallback(err)
            } else {
                throw err
            }
        })
}

module.exports = {
    generateCertificateImageAsync,
}
