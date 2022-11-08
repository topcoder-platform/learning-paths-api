'use strict';

const fetcher = require('../fetcher');

(async () => {
    const result = await fetcher.handleCourses(1);

    console.log('fetcher result', result);
})();