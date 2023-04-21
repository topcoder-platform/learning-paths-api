const axios = require('axios');
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const { SFDC_TOKEN_PARAM_NAME } = require('./constants');
const { Scheduler } = require('aws-sdk');

const SFDC_ENDPOINT = process.env.SFDC_ENDPOINT;
const ACCOUNT_NAME = 'Stripe.com';

async function handle(event) {
  console.log('SFDC handler', JSON.stringify(event, null, 2));

  const stripeEvent = event.detail;

  const token = await getSFDCAccessToken();
  if (!token) {
    throw new Error('No SFDC token!');
  }

  const sfdcData = transformStripeEvent(stripeEvent);
  const response = await postDataToSFDC(token, sfdcData);
  console.log(response);

  return {
    statusCode: 200,
  };
};

function transformStripeEvent(event) {
  const data = event.data.object;

  let sfdcData = {
    id: data.id,
    account_name: ACCOUNT_NAME,
    customer_name: '',
    member_handle: '',
    amount_refunded: data.amount_refunded / 100 || 0,
    metadata: data.metadata,
    status: data.status,
  }

  // Normalize the data for SFDC
  switch (data.object) {
    case 'payment_intent':
      sfdcData.amount_due = data.amount_capturable / 100;
      sfdcData.amount_captured = data.amount_received / 100;
      break;
    case 'charge':
      sfdcData.amount_due = data.amount / 100;
      sfdcData.amount_captured = data.amount_captured / 100;
      break;
    default:
      break;
  }

  return sfdcData;
}

/**
 * Posts the Stripe event to SFDC
 * 
 * @param {String} token the SFDC access token
 * @param {Object} event JSON Stripe event object
 */
async function postDataToSFDC(token, event) {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(event),
  };

  const response = await axios.post(SFDC_ENDPOINT, options)
  return response;
}

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