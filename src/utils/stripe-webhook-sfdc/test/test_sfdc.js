const sfdcHandler = require('../src/sfdc_handler');

const paymentEvent = require('../docs/payment_intent_succeeded.json');
const refundEvent = require('../docs/charge_refunded.json');

(async () => {
    let data = await sfdcHandler.handle(paymentEvent);
    console.log(data);

    data = await sfdcHandler.handle(refundEvent);
    console.log(data);
})();