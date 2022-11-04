'use strict';

const fetcher = require('../fetcher');

(async () => {
    await fetcher.handleCourses();
})();