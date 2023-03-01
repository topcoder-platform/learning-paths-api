
const db = require('../models');

(async () => {
    const enrollments = await db.CertificationEnrollment.findAll(
        {
            include: {
                model: db.CertificationResourceProgress,
                as: 'certificationProgresses',
                // include: {
                //     model: db.FccCompletedLesson,
                //     as: 'completedLessons'
                // }
            }
        }
    );

    console.log("Enrollments", JSON.stringify(enrollments, null, 2));
})();