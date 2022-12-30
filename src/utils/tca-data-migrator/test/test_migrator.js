const migrator = require('../migrator.js');

(async () => {
    await migrator.migrateCourses();
})();