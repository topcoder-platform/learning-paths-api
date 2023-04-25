const axios = require('axios');
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const { getStripeSecrets } = require('./common');

const { SFDC_TOKEN_PARAM_NAME } = require('./constants');

const SFDC_ENDPOINT = process.env.SFDC_ENDPOINT;
if (!SFDC_ENDPOINT) {
  throw new Error('Missing SFDC_ENDPOINT environment variable');
}

const LOG_EVENT = process.env.LOG_EVENT === 'true' || false;

const ACCOUNT_NAME = 'Stripe.com';

/**
 * The webhook handler function. This is the entry point for the Lambda that passes 
 * Stripe webhook events to SFDC.
 * 
 * @param {Object} event the Stripe event to handle, wrapped in an EventBridge event
 * @returns the HTTP status code of the SFDC API call
 */
async function handle(event) {
  if (LOG_EVENT) console.log('SFDC handler', JSON.stringify(event, null, 2));

  const token = await getSFDCAccessToken();
  if (!token) {
    throw new Error('No SFDC token!');
  }

  const stripeEvent = event.detail;
  const sfdcData = await transformStripeEvent(stripeEvent);
  console.log('SFDC data', JSON.stringify(sfdcData, null, 2));

  const statusCode = await postDataToSFDC(token, sfdcData);

  return {
    statusCode: statusCode,
  };
};

/**
 * Transforms the data in the Stripe event to a format that can be 
 * posted to SFDC. Adds contextual data and convers Stripe amounts in
 * cents to SFDC amounts in dollars.
 * 
 * @param {Object} event the Stripe event to pass to SFDC
 * @returns an object to post to SFDC
 */
async function transformStripeEvent(event) {
  const data = event.data.object;
  const customerId = data.customer;

  const { customer_name, member_handle } = await getCustomerInfo(customerId);

  let sfdcData = {
    id: data.id,
    account_name: ACCOUNT_NAME,
    customer_name: customer_name,
    member_handle: member_handle,
    amount_refunded: data.amount_refunded / 100 || 0,
    metadata: data.metadata,
    status: data.status,
  }

  // Normalize the data for SFDC
  switch (data.object) {
    case 'payment_intent':
      sfdcData.amount_due = data.amount_capturable / 100;
      sfdcData.amount_captured = data.amount_received / 100;
      sfdcData.amount_paid = data.amount_received / 100;

      break;
    case 'charge':
      sfdcData.amount_due = data.amount / 100;
      sfdcData.amount_captured = data.amount_captured / 100;
      sfdcData.amount_paid = data.amount_captured / 100;

      break;
    default:
      console.error(`Unhandled Stripe object type: ${data.object}`);

      break;
  }

  return sfdcData;
}

/**
 * Retrieves customer name and member handle from Stripe API, 
 * if a customer ID is provided.
 * 
 * @param {String} customerId the id of the Stripe customer
 * @returns the customer name and member handle
 */
async function getCustomerInfo(customerId) {
  let customer_name = 'NOT FOUND';
  let member_handle = 'NOT FOUND';

  if (!customerId) {
    return { customer_name, member_handle }
  }

  const stripeSecrets = await getStripeSecrets();
  const stripeSecretKey = stripeSecrets['STRIPE_SECRET_KEY'];
  if (!stripeSecretKey) {
    throw new Error('No Stripe secret key!');
  }

  const stripe = require('stripe')(stripeSecretKey);
  const customer = await stripe.customers.retrieve(customerId);

  if (customer) {
    customer_name = customer.name;
    member_handle = customer.metadata.member_handle;
  }

  return { customer_name, member_handle }
}

/**
 * Posts the Stripe event to SFDC using the provided access token.
 * 
 * @param {String} token the SFDC access token
 * @param {Object} event JSON Stripe event object
 */
async function postDataToSFDC(token, event) {
  const data = JSON.stringify(event);
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  let response, statusCode;
  try {
    response = await axios.post(SFDC_ENDPOINT, data, config)
    statusCode = response.status;
  } catch (error) {
    console.error(error.message);
    statusCode = error?.response.status;
  }

  return statusCode;
}

/**
 * Retrieves the SFDC access token from AWS SSM Param Store.
 * 
 * @returns the SFDC access token
 */
async function getSFDCAccessToken() {
  const client = new SSMClient({ region: 'us-east-1' });
  const input = {
    Name: SFDC_TOKEN_PARAM_NAME,
    WithDecryption: true,
  };

  let token = '';
  try {
    const command = new GetParameterCommand(input);
    const data = await client.send(command);
    token = data.Parameter.Value;
  } catch (error) {
    console.error('Error getting SFDC token');
    throw error;
  }

  return token;
}

module.exports = {
  getSFDCAccessToken,
  handle,
}