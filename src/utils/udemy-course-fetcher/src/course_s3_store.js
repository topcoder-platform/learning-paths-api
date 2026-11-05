// reads and writes Udemy course JSON files to/from AWS S3

const { Upload } = require('@aws-sdk/lib-storage')
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3')

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })

const UDEMY_COURSE_DATA_BUCKET = process.env.UDEMY_COURSE_DATA_BUCKET || 'tca-udemy-course-data'
const COURSES_FILE = 'udemy-courses';

/**
 * Writes the JSON course data to AWS S3
 * 
 * @param {Object} courseJson a JSON object representing the Udemy Courses to save to a file
 * @returns the filename of the JSON file written to S3
 */
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
        const data = await new Upload({
            client: s3,
            params
        }).done();
        console.log(`Course file successfully uploaded to S3 ${data.Location}`);

        return filename;
    } catch (error) {
        console.log(error);
    }
}

/**
 * Gets a file from AWS S3 and returns it's contents as JSON
 * 
 * @param {String} filename the filename to read
 * @returns the JSON contents of the file
 */
async function readFromS3(filename) {
    try {
        const params = {
            Bucket: UDEMY_COURSE_DATA_BUCKET,
            Key: filename
        };

        const response = await s3.send(new GetObjectCommand(params));
        const courseJson = JSON.parse(await response.Body.transformToString());

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
