const {
  EventBridgeClient,
  PutEventsCommand
} = require("@aws-sdk/client-eventbridge");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);

const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

async function handle(event) {
  const { headers, body } = event;

  let stripeEvent;
  let statusCode = 200;
  let message = '';

  try {
    if (!headers || !body) {
      throw new Error('Missing headers or body in request');
    }

    stripeEvent = verifySignature(event);
    await handleEvent(stripeEvent);

  } catch (error) {
    console.log(`⚠️  Webhook signature verification failed.`, error.message);
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
      sendToEventBridge(stripeEvent);

      break;
    case 'charge.refunded':
      const refundedCharge = stripeEvent.data.object;
      // console.dir(refundedCharge);
      console.log(`Charge ${refundedCharge.id} for $${refundedCharge.amount / 100} was refunded`);
      sendToEventBridge(stripeEvent);

      break;
    default:
      // Unexpected event type
      console.warn(`Unhandled event type: ${stripeEvent.type}`);
  }
}

function verifySignature(event) {
  let stripeEvent = event.body;

  const signature = event.headers['stripe-signature'];
  if (!signature) {
    throw new Error('Missing stripe-signature header');
  }

  stripeEvent = stripe.webhooks.constructEvent(
    event.body,
    signature,
    endpointSecret
  );

  return stripeEvent;
}

async function sendToEventBridge(event) {
  const client = new EventBridgeClient({ region: 'us-east-1' });

  const params = {
    Entries: [
      {
        Source: 'stripe-webhook-lambda',   // the source must match the event source in the rule in EventBridge
        Detail: JSON.stringify(event),
        DetailType: 'stripe-webhook-detail-type',
        EventBusName: 'default',
        Time: new Date(),
      },
    ],
  };

  try {
    const data = await client.send(new PutEventsCommand(params));
    console.log(data);
  } catch (err) {
    console.log("Error", err);
  }
}

module.exports = {
  handle,
}