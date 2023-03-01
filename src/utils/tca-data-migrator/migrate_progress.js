const migrator = require('./progress_migrator.js');

(async () => {
    try {
        await migrator.migrateProgresses();
    } catch (error) {
        console.error(error)
    }
})();