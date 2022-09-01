# TCA MongoDB Trigger Handler

This utility handles events created by the freeCodeCamp Atlas MongoDB. Specifically, when an update is performed on the User table in MongoDB, a trigger sends information about the update to AWS EventBridge, which in turn triggers a Lambda function. This Lambda function then calls an API endpoint in the Learning Paths API to update data in DynamoDB. It uses the Serverless.com framework to manage AWS resources.

- [MongoDB Configuration](#mongodb-configuration)
- [AWS Configuration](#aws-configuration)
- [Sequence Diagram](#sequence-diagram)

## MongoDB Configuration

The trigger is configured in the Atlas MongoDB web console, as described in their [documentation](https://www.mongodb.com/docs/atlas/triggers/). The trigger sends events to a custom AWS EventBridge event bus as described [here](https://www.mongodb.com/docs/atlas/triggers/eventbridge/) using MongoDB as a "partner event source."

## AWS Configuration 

The custom EventBridge event bus was manually configured. A Serverless.com Infrastructure as Code (IaC) template is used to manage the deployment of the EventBridge rule and Lambda function that it triggers. The Lambda function makes the API call to the Learning Paths API to update the lesson completion information.

## Sequence Diagram



