const migrator = require('../progress_migrator.js');

(async () => {
    await migrator.migrateProgresses();
})();