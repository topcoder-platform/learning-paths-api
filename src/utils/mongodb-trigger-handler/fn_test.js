'use strict';

const handler = require('./handler');
const event = require('./test_event.json');

// A simple anonymous async function invoker to test the Lambda handler

(async () => {
    await handler.handle(event);
})();