const service = require('../CourseCompletionShortcutService');

(async () => {
    const progressId = '6bab39a3-4821-458f-a943-41911c919800';
    const userId = '88778750';

    const completion = await service.shortcutCompleteFccCourse(progressId, userId);

})();