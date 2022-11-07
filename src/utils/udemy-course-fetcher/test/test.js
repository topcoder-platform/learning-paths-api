'use strict';

const fetcher = require('../fetcher');

(async () => {
    const result = await fetcher.handleCourses();

    console.log('fetcher result', result);
})();