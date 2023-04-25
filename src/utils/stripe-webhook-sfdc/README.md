# Stripe to SFDC (Salesforce.com) webhook handler

This project uses the serverless.com framework to create AWS resources that handle webhook calls from Stripe.com, and posts the data securely to SFDC. It also implements an automated process to regularly regenerate and store the SFDC access token used to make calls to the SFDC API.

## Architecture

All of the resources these systems use are provisioned in AWS via CloudFormation, which is itself provisioned using the serverless.com framework via a [serverless.yml](./serverless.yml) file. 

### Webhook handler

The architecture of this system is depicted in [this diagram](./docs/webhook_handler.png). It uses the following AWS services:
- API Gateway to receive the Stripe webhook calls
- Lambda to verify the signature of the webhook call
- EventBridge to pass valid webhooks on for processing
- Another Lambda to format the data for SFDC, retrieve the access token, and post the data to SFDC

### SFDC Token Refresher

The SFDC access token is stored in Systems Manager's Parameter Store and is automatically refreshed prior to expiration. This process is also depicted in the [service diagram](./docs/webhook_handler.png). The services composed to perform this are:
- SSM Param Store to store the token with an expiration date
- A Param Store policy to trigger refresh of the token prior to expiration
- An EventBridge rule to process the expiration notification
- A Lambda to retrieve and store a new token and update the expiration policy

## Local development

The stripe CLI offers a simple path to local development. You can use the CLI to generate test webhooks and to listen for the webhooks locally and forward them to a local server. A small [Express-based server](./src/test_server.js) process is provided for that purpose, listening on port 4242. 

A few local environment variables must be configured to develop and test the webhook code locally:
- `STRIPE_SECRETS_NAME`: dev/tca-stripe-secrets
- `SFDC_ENDPOINT`: https://topcoder--opty.sandbox.my.salesforce.com/services/apexrest/SfdcStripe/

To test webhooks locally, three terminal processes need to be used:
1. Run the local test server via `npm start`
2. Run the Stripe webhook listener via `stripe listen --forward-to localhost:4242/webhook`
3. Trigger webhooks using the CLI, for example: `stripe trigger payment_intent.succeeded`

The `trigger` call invokes a test webhook from Stripe.com that will be received locally *and* by the AWS API Gateway endpoint. 

NOTE: When the `stripe listen` command is executed, the output will include a "webhook signing secret". This value is used to verify the signature of the incoming webhooks to ensure they are from Stripe and are valid. This value is curently stored alongside the non-CLI value in AWS Secrets Manager, though the code could be modified to read it from a local environment variable. If you are seeing errors related to signature verification failing using the CLI, check that the value of the signing secret shown in the terminal matches what's stored in the `CLI_ENDPOINT_SECRET` value in AWS.

Local development of webhook handling currently only executes the webhook handler itself locally. The local handler still puts EventBridge messages on the event bus in AWS, triggering the SFDC handler in AWS. A few simple test execution functions are located in the [/test](./test/) directory to directly trigger lambda code locally for development purposes.

### Sample webhook payloads
Samples of two of the Stripe webhook event payloads are included in the [/docs](./docs/) directory for quick reference. 

## Deployment

A convenience shell script [deploy_dev.sh](./deploy_dev.sh) is provided to deploy the project to the AWS Dev account using a specific AWS profile and the serverless framework. A production version of the script is included as well. Both of these scripts rely on having the respective IAM profiles resident locally with current credentials in the `~/.aws/credentials` file.

As the code currently exists, the SFDC Handler expects the SFDC access token to already be stored in SSM Param Store. This can easily be achieved on initial deployment by triggering the [SFDC Token Refresher](./src/sfdc_token_refresher.js).