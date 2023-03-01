
const db = require('../models');

(async () => {
    const progresses = await db.FccCourseProgress.findAll(
        {
            include: {
                model: db.FccModuleProgress,
                as: 'moduleProgresses',
                include: {
                    model: db.FccCompletedLesson,
                    as: 'completedLessons'
                }
            }
        }
    );

    console.log("All progresses:", JSON.stringify(progresses, null, 2));
})();