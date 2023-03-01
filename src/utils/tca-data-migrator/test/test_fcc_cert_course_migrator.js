const migrator = require('../course_migrator.js');

(async () => {
    try {
        await migrator.migrate();
    } catch (error) {
        console.error(error)
    }
})();