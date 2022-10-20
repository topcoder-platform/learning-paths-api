const chromium = require('@sparticuz/chrome-aws-lambda')
const AWS = require('aws-sdk')

exports.index = async (event) => {

    if (!event?.Records?.[0].body) {
        const errorMessage = `The event must have a body.`
        console.error(errorMessage, event)
        throw new Error(errorMessage)
    }

    let browser = undefined

    try {

        const { bucket, files, screenshotSelector } = validateParams(event.Records[0].body)

        // create and save each file
        for (let i = 0; i < files.length; i++) {
            browser = browser ?? (await initializeBrowser())
            await generateAndSaveImageAsync(browser, bucket, files[i], screenshotSelector)
        }

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

async function generateAndSaveImageAsync(browser, bucket, file, screenshotSelector) {

    console.info('Generating', file.name)

    // go to the page
    const page = await browser.newPage()
    await page.goto(file.url)

    // get the screenshot of the page
    let screenshot = undefined
    const imageConfig = { type: 'jpeg' }

    // if there's an element, wait for it and save it
    if (!!screenshotSelector) {

        // wait for the specific element to appear
        await page.waitForSelector(screenshotSelector, { timeout: 1000 })

        // select the element
        const element = await page.$(screenshotSelector)

        // take a screenshot of the element
        screenshot = await element.screenshot(imageConfig)

    } else {

        // take a screenshot of the entire page
        screenshot = await page.screenshot(imageConfig)
    }

    console.info('Generated', file.name)

    console.info('Saving', file.name)

    await putObjectToS3Async(
        bucket,
        file.name,
        screenshot
    )

    console.info('Saved', file.name)
}

async function initializeBrowser() {

    // set up the chromium headless browser
    return await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    })
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

    validateRequired([
        'bucket',
        'files',
    ], params)

    // verify the files param is a non-empty array
    if (!params.files?.[0]) {
        throw new Error(`The files param must be a non-empty array: ${params.files?.[0]}`)
    }

    params.files
        .forEach(file => {
            validateRequired([
                'name',
                'url'
            ], file)
        })

    return params
}

function validateRequired(required, params) {

    const requiredParam = required
        .find(param => !params?.[param])

    if (!!requiredParam) {
        throw new Error(`The ${requiredParam} param is required.`)
    }
}
