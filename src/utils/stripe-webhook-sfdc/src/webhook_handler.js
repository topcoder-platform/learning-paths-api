const {
  EventBridgeClient,
  PutEventsCommand
} = require("@aws-sdk/client-eventbridge");

const { verifySignature } = require('./common');

// These define the pattern of the EventBridge event that will
// trigger the SFDC handler Lambda function.
const WEBHOOK_EVENT_SOURCE = process.env.WEBHOOK_EVENT_SOURCE || 'stripe-webhook-lambda';
const WEBHOOK_EVENT_DETAIL_TYPE = process.env.WEBHOOK_EVENT_DETAIL_TYPE || 'stripe-webhook-detail-type';

/**
 * The webhook handler function. This is the entry point for the Lambda 
 * function that is triggered by API Gateway when a Strip webhook event 
 * is received.
 * 
 * @param {Object} event The JSON event triggering this Lambda
 * @returns HTTP status code and message
 */
async function handle(event) {
  const { headers, body } = event;

  let stripeEvent;
  let statusCode = 200;
  let message = 'success';

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

/**
 * Hadles specific Stripe webhook events. If you want a new event to be
 * handled, you have to add it here.
 * 
 * Events are handled by simply logging them and putting an event on the 
 * EventBridge default message bus for further processing.
 * 
 * @param {Object} stripeEvent The Stripe event to handle
 * @throws {Error} If the event type is not handled
 */
async function handleEvent(stripeEvent) {
  switch (stripeEvent.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = stripeEvent.data.object;
      console.log(`PaymentIntent ${paymentIntent.id} for $${paymentIntent.amount / 100} was successful`);
      await sendToEventBridge(stripeEvent);

      break;
    case 'charge.refunded':
      const refundedCharge = stripeEvent.data.object;
      console.log(`Charge ${refundedCharge.id} for $${refundedCharge.amount / 100} was refunded`);
      await sendToEventBridge(stripeEvent);

      break;
    default:
      throw new Error(`Unhandled Stripe event type: ${stripeEvent.type}`);
  }
}

/**
 * A simple wrapper around the AWS EventBridge SDK to send events to 
 * the default bus for further processing. 
 * 
 * @param {Object} event The Stripe event to send to EventBridge
 */
async function sendToEventBridge(event) {
  const client = new EventBridgeClient({ region: 'us-east-1' });

  const params = {
    Entries: [
      {
        Source: WEBHOOK_EVENT_SOURCE,
        Detail: JSON.stringify(event),
        DetailType: WEBHOOK_EVENT_DETAIL_TYPE,
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