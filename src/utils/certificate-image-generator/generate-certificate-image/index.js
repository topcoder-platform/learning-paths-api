const chromium = require('@sparticuz/chrome-aws-lambda');
const AWS = require('aws-sdk');

exports.handler = async (event) => {

    validatParams(event);

    let browser = undefined;

    try {

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
        await page.goto(event.url);

        // get the screenshot of the page
        let screenshot = undefined;
        const imageConfig = { type: 'jpeg' };

        // if there's an element, wait for it and save it
        if (!!event.screenshotSelector) {

            // wait for the specific element to appear
            await page.waitForSelector(event.screenshotSelector);

            // select the element
            const element = await page.$(event.screenshotSelector);

            // take a screenshot of the element
            screenshot = await element.screenshot(imageConfig);

        } else {
            screenshot = await page.screenshot(imageConfig);
        }

        await putObjectToS3Async(
            event.bucket,
            event.filePath,
            screenshot
        );

    } catch (error) {
        // TODO: error handling
        console.error(error);

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

function validatParams(event) {

    const requiredParam = [
        'bucket',
        'filePath',
        'url',
    ]
        .find(param => !event?.[param])

    if (requiredParam) {
        throw new Error(`The ${requiredParam} param is required.`)
    }
}
