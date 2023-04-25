const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const { RUNNING_IN_AWS } = require('./constants');

// The name of the secret in AWS Secrets Manager
const STRIPE_SECRETS_NAME = process.env.STRIPE_SECRETS_NAME;

/**
 * Retrieves the Stripe secrets from AWS Secrets Manager.
 * 
 * @returns {Object} the Stripe secrets from AWS Secrets Manager
 */
async function getStripeSecrets() {
    const client = new SecretsManagerClient({
        region: "us-east-1",
    });

    let response, secrets;

    try {
        response = await client.send(
            new GetSecretValueCommand({
                SecretId: STRIPE_SECRETS_NAME,
                VersionStage: "AWSCURRENT",
            })
        );

        secrets = JSON.parse(response.SecretString);
    } catch (error) {
        throw error;
    }

    return secrets;
}

/**
 * Verifies the signature of the Stripe event and returns the event.
 * 
 * @param {Object} event the raw Stripe event
 * @returns the verified Stripe event 
 */
async function verifySignature(event) {
    let stripeEvent = event.body;

    const stripeSecrets = await getStripeSecrets();

    // NOTE: the endpoint secret used in local Stripe CLI testing
    // is different than the one used in AWS dev and prod.
    let endpointSecret;

    if (RUNNING_IN_AWS) {
        endpointSecret = stripeSecrets['ENDPOINT_SECRET'];
    } else {
        endpointSecret = stripeSecrets['CLI_ENDPOINT_SECRET'];
    }
    const stripeSecretKey = stripeSecrets['STRIPE_SECRET_KEY'];
    if (!endpointSecret || !stripeSecretKey) {
        throw new Error('Missing Stripe secrets');
    }

    const stripe = require('stripe')(stripeSecretKey);

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
    getStripeSecrets,
    verifySignature,
}