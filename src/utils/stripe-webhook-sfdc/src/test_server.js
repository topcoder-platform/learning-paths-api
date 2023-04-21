const express = require('express');
const app = express();
const webhookHandler = require('./webhook_handler');

app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
    webhookHandler.handle(request)
        .then((handlerResponse) => {
            response.status(handlerResponse.statusCode).send(handlerResponse.body);
        })
});

app.listen(4242, () => console.log('Running on port 4242'));