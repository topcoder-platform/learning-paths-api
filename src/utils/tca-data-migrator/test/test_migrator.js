const migrator = require('../course_migrator.js');

(async () => {
    await migrator.migrateCourses();
})();