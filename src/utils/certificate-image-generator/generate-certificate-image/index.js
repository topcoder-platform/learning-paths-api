const chromium = require('@sparticuz/chrome-aws-lambda')
const AWS = require('aws-sdk')

exports.handler = async (event) => {

    if (!event?.Records?.[0].body) {
        const errorMessage = `The event must have a body.`
        console.error(errorMessage, event)
        throw new Error(errorMessage)
    }

    let browser = undefined

    try {

        const body = event.Records[0].body
        const params = body.constructor.name === 'String' ? JSON.parse(body) : body
        validateParams(params)

        // set up the chromium headless browser
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        })

        // go to the page
        const page = await browser.newPage()
        await page.goto(params.url)

        // get the screenshot of the page
        let screenshot = undefined
        const imageConfig = { type: 'jpeg' }

        // if there's an element, wait for it and save it
        if (!!params.screenshotSelector) {

            // wait for the specific element to appear
            await page.waitForSelector(params.screenshotSelector, { timeout: 1000 })

            // select the element
            const element = await page.$(params.screenshotSelector)

            // take a screenshot of the element
            screenshot = await element.screenshot(imageConfig)

        } else {

            // take a screenshot of the entire page
            screenshot = await page.screenshot(imageConfig)
        }

        await putObjectToS3Async(
            params.bucket,
            params.filePath,
            screenshot
        )

        console.info(`Created cert image for ${params.url}`)
        console.info(`Saved cert image at ${params.filePath} in ${params.bucket}`)

    } catch (error) {
        console.error(error)
        console.error(event?.Records?.[0]?.body)
        throw error

    } finally {
        // if a browser was created,
        // make sure to close it
        if (!!browser?.close) {
            await browser.close()
        }
    }
}

async function putObjectToS3Async(bucket, key, image) {

    const params = {
        Bucket: bucket,
        Key: key,
        Body: image
    }

    await new AWS.S3().putObject(params)
        .promise()
}

function validateParams(params) {

    const requiredParam = [
        'bucket',
        'filePath',
        'url',
    ]
        .find(param => !params?.[param])

    if (requiredParam) {
        const errorMessage = `The ${requiredParam} param is required.`
        console.error(errorMessage, params)
        throw new Error(errorMessage)
    }
}
