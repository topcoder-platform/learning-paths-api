const service = require('../CourseCompletionShortcutService');

(async () => {
    const progressId = 'f7ab28ae-beb0-4084-8a4d-b21a8cdb5323';
    const userId = '88778750';

    const completion = await service.shortcutCompleteFccCourse(progressId, userId);

})();