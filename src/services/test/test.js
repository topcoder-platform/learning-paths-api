const service = require('../CourseCompletionReconciliationService');

(async () => {
    const { reconcileCourseCompletion } = service;

    await reconcileCourseCompletion();
})();