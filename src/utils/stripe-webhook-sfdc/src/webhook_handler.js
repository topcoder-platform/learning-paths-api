const {
  EventBridgeClient,
  PutEventsCommand
} = require("@aws-sdk/client-eventbridge");

const { verifySignature } = require('./common');

async function handle(event) {
  const { headers, body } = event;

  let stripeEvent;
  let statusCode = 200;
  let message = '';

  try {
    if (!headers || !body) {
      throw new Error('Missing headers or body in request');
    }

    stripeEvent = await verifySignature(event);
    await handleEvent(stripeEvent);

  } catch (error) {
    console.log(`Webhook signature verification failed.`, error.message);
    statusCode = 400;
    message = error.message;
  }

  const response = {
    statusCode: statusCode,
    body: JSON.stringify(message),
  }

  return response;
};

async function handleEvent(stripeEvent) {
  switch (stripeEvent.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = stripeEvent.data.object;
      // console.dir(paymentIntent);
      console.log(`PaymentIntent ${paymentIntent.id} for $${paymentIntent.amount / 100} was successful`);
      await sendToEventBridge(stripeEvent);

      break;
    case 'charge.refunded':
      const refundedCharge = stripeEvent.data.object;
      // console.dir(refundedCharge);
      console.log(`Charge ${refundedCharge.id} for $${refundedCharge.amount / 100} was refunded`);
      await sendToEventBridge(stripeEvent);

      break;
    default:
      // Unexpected event type
      console.warn(`Unhandled event type: ${stripeEvent.type}`);
  }
}

async function sendToEventBridge(event) {
  const client = new EventBridgeClient({ region: 'us-east-1' });

  const params = {
    Entries: [
      {
        Source: 'stripe-webhook-lambda',
        Detail: JSON.stringify(event),
        DetailType: 'stripe-webhook-detail-type',
        EventBusName: 'default',
        Time: new Date(),
      },
    ],
  };

  try {
    const data = await client.send(new PutEventsCommand(params));
    console.log('EventBridge response', data);
  } catch (err) {
    console.log("Error", err);
  }
}

module.exports = {
  handle,
}