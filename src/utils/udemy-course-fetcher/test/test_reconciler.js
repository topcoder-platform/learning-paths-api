'use strict';

const courseReconciler = require('../src/course_reconciler');

(async () => {
    const result = await courseReconciler.reconcileCourses();
    console.log('result:', result)
})();