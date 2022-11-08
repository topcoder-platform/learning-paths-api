// reads and writes Udemy course JSON files to/from AWS S3

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var s3 = new AWS.S3();

const UDEMY_COURSE_DATA_BUCKET = 'tca-udemy-course-data'
const COURSES_FILE = 'udemy-courses';

async function writeToS3(courseJson) {
    var buf = Buffer.from(JSON.stringify(courseJson));

    const ts = new Date(Date.now()).toISOString();
    const filename = `${COURSES_FILE}-${ts}.json`

    console.log('S3 store uploading:', filename);

    var params = {
        Bucket: UDEMY_COURSE_DATA_BUCKET,
        Key: filename,
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: 'application/json'
    };

    try {
        const data = await s3.upload(params).promise();
        console.log(`Course file successfully uploaded to S3 ${data.Location}`);

        return filename;
    } catch (error) {
        console.log(error);
    }
}

async function readFromS3(filename) {
    try {
        const params = {
            Bucket: UDEMY_COURSE_DATA_BUCKET,
            Key: filename
        };

        const response = await s3.getObject(params).promise();
        const courseJson = JSON.parse(response.Body.toString());

        return courseJson

    } catch (error) {
        console.log(error);
        return;
    }
}

module.exports = {
    readFromS3,
    writeToS3
}