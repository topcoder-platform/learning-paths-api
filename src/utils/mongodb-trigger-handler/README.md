# TCA MongoDB Trigger Handler

This utility handles events created by the freeCodeCamp Atlas MongoDB. Specifically, when an update is performed on the User table in MongoDB, a trigger sends information about the update to AWS EventBridge, which in turn triggers a Lambda function. This Lambda function then calls an API endpoint in the Learning Paths API to update data in DynamoDB. It uses the Serverless.com framework to manage AWS resources.

- [MongoDB Configuration](#mongodb-configuration)
- [AWS Configuration](#aws-configuration)
- [Deployment](#deployment)

## MongoDB Configuration

The trigger is configured in the Atlas MongoDB web console, as described in their [documentation](https://www.mongodb.com/docs/atlas/triggers/). The trigger sends events to a custom AWS EventBridge event bus as described [here](https://www.mongodb.com/docs/atlas/triggers/eventbridge/) using MongoDB as a "partner event source."

The `update` trigger sends data about the fields that were updated in the event. We need to include information that identifies both the user and the lesson that was updated, so we set up the trigger to send the full document and use a `project expression` to filter the data down to just what we need to perform the update in DynamoDB, as shown in the [mongo_trigger_project_expr.json](./mongo_trigger_project_expr.json) file. We have to do this because there is a 256KB limit on the event size sent to AWS via an event bus, and the freeCodeCamp MongoDB document can get quite large as a user completes more and more courses. This `project expression` is set in the MongoDB trigger web console.

## AWS Configuration 

The custom EventBridge event bus was manually configured. A [Serverless.com](https://www.serverless.com/framework/docs) Infrastructure as Code (IaC) template is used to manage the deployment of the EventBridge rule and Lambda function that it triggers. The Lambda function makes the API call to the Learning Paths API to update the lesson completion information.

## Deployment

The Lambda is deployed via the `serverless` (or `sls`) command from the `utils/mongodb-trigger-handler` directory. Serverless is installed as a global npm package via:

```
npm i -g serverless
```

The Lambda requires a set of local environment variables to be defined to populate the serverless template during deployment:

- `LEARNING_PATHS_API_ENDPOINT`: the URL for the Learning Paths API endpoint the Lambda will call (dev: https://api.topcoder-dev.com/v5/learning-paths/certification-progresses/complete-lesson-via-mongo-trigger)

Because the serverless deployment effectively uses the AWS CLI under the hood, you must have valid AWS credentials on your system for the deployment to work. The easiest way to do that is to setup AWS profiles in the `~/.aws/config` and `~/.aws/credentials` files. You can then deploy the serverless stack via (assuming the profi):

```
$ sls deploy --aws-profile <your AWS IAM profile name>
```

There is a `deploy_dev.sh` script in this utility's root directory that uses the Topcoder AWS dev account IAM profile, so you can deploy the stack via:

```
$ ./deploy_dev.sh 
```






### Keycloak migration

Run `nvm use` in this folder (Node 24.19.0) before npm commands. Configure
`M2M_PROVIDER=keycloak`, `KEYCLOAK_ISSUER`, `KEYCLOAK_AUDIENCE`,
`KEYCLOAK_TOKEN_URL`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, and
`KEYCLOAK_SCOPE=update:certification_progress`. Use the managed HTTPS endpoint.
The pinned shared core validates issued tokens before the Learning Paths call
and caches verified credentials. No Auth0 fallback is used. The branch updates
Serverless environment references for a later rollout; do not deploy without
the dedicated Keycloak configuration. `npm run lint`, `npm run build`, and
`npm test` validate locally without invoking the Lambda or updating progress.
