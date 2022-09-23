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

- `AUTH0_URL`: the Auth0 URL used to retrieve the machine-to-machine token (dev: https://topcoder-dev.auth0.com/oauth/token)
- `AUTH0_AUDIENCE`: the Auth0 audience API for which the token will be issued (dev: https://m2m.topcoder-dev.com/)
- `AUTH0_CLIENT_ID`: the Auth0 client ID for the application that's requesting the API token (from the Auth0 console)
- `AUTH0_CLIENT_SECRET`: the Auth0 client secret for the application that's requesting the API token (from the Auth0 console)
- `LEARNING_PATHS_API_ENDPOINT`: the URL for the Learning Paths API endpoint the Lambda will call (dev: https://api.topcoder-dev.com/v5/learning-paths/certification-progresses/complete-lesson-via-mongo-trigger)

Because the serverless deployment effectively uses the AWS CLI under the hood, you must have valid AWS credentials on your system for the deployment to work. The easiest way to do that is to setup AWS profiles in the `~/.aws/config` and `~/.aws/credentials` files. You can then deploy the serverless stack via (assuming the profi):

```
$ sls deploy --aws-profile <your AWS IAM profile name>
```

There is a `deploy_dev.sh` script in this utility's root directory that uses the Topcoder AWS dev account IAM profile, so you can deploy the stack via:

```
$ ./deploy_dev.sh 
```





