const fs = require('fs');
const path = require('path');

const s3Store = require('../src/course_s3_store');

const COURSE_FILES_DIR = "course-files";

(async () => {
    const filename = 'udemy-courses-truncated.json';
    const courseFile = path.join(__dirname, '..', COURSE_FILES_DIR, filename);

    const jsonData = JSON.parse(
        fs.readFileSync(courseFile)
    );

    const uploadedFilename = await s3Store.writeToS3(jsonData);

    const courseJson = await s3Store.readFromS3(uploadedFilename);
    console.log('courseJson', courseJson);
})();