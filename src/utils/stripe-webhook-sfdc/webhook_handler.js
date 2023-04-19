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
    handleEvent(stripeEvent);

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

function handleEvent(stripeEvent) {
  switch (stripeEvent.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = stripeEvent.data.object;
      // console.dir(paymentIntent);
      console.log(`PaymentIntent ${paymentIntent.id} for $${paymentIntent.amount / 100} was successful!`);

      break;
    case 'charge.refunded':
      const refundedCharge = stripeEvent.data.object;
      // console.dir(refundedCharge);
      console.log(`Charge ${refundedCharge.id} for $${refundedCharge.amount / 100} was refunded!`);

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

module.exports = {
  handle,
}