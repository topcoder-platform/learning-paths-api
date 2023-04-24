const sfdcHandler = require('../src/sfdc_handler');
const fs = require('fs');
const path = require('path');

const paymentEvent = require('../docs/payment_intent_succeeded.json');
const refundEvent = require('../docs/charge_refunded.json');

(async () => {
    const data = await sfdcHandler.handle(paymentEvent);
    console.log(data);
})();