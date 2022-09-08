const chromium = require('@sparticuz/chrome-aws-lambda');
const AWS = require('aws-sdk');

exports.handler = async (event) => {

    if (!event?.Records?.[0].body) {
        const errorMessage = `The event must have a body.`
        console.error(errorMessage, event)
        throw new Error(errorMessage);
    }

    let browser = undefined;

    try {

        const params = JSON.parse(event.Records[0].body);
        console.debug('after parse', params, event.Records[0].body)
        console.debug('fun fun fun', params.bucket, event.Records[0].body)

        validatParams(params);

        // set up the chromium headless browser
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        // go to the page
        const page = await browser.newPage();
        await page.goto(params.url);

        // get the screenshot of the page
        let screenshot = undefined;
        const imageConfig = { type: 'jpeg' };

        // if there's an element, wait for it and save it
        if (!!params.screenshotSelector) {

            // wait for the specific element to appear
            await page.waitForSelector(params.screenshotSelector);

            // select the element
            const element = await page.$(params.screenshotSelector);

            // take a screenshot of the element
            screenshot = await element.screenshot(imageConfig);

        } else {
            screenshot = await page.screenshot(imageConfig);
        }

        await putObjectToS3Async(
            params.bucket,
            params.filePath,
            screenshot
        );

    } catch (error) {
        // TODO: error handling
        console.error(error, event);

    } finally {
        // if a browser was created,
        // make sure to close it
        if (!!browser?.close) {
            await browser.close();
        }
    }
};

async function putObjectToS3Async(bucket, key, image) {

    var s3 = new AWS.S3();
    var params = {
        Bucket: bucket,
        Key: key,
        Body: image
    }
    return s3.putObject(params, function (err, data) {
        if (err) {
            console.error(err, err.stack);
        } else {
            console.info(`Successfully created ${key}`);
        }
    });
}

function validatParams(params) {

    console.debug('test 3', params.bucket, params["bucket"])

    const requiredParam = [
        'bucket',
        'filePath',
        'url',
    ]
        .find(param => {
            console.debug(param, params?.[param])
            return !params?.[param]});
    if (requiredParam) {
        const errorMessage = `The ${requiredParam} param is required.`
        console.error(errorMessage, params)
        throw new Error(errorMessage);
    }
}
