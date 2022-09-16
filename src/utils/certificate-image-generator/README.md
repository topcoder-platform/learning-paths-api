# TCA Certificate Image Generator

This utility creates an image of each certficate as it's earned so that the image can be used in SSR meta tags.

- [Sequence Diagram](#sequence-diagram)
- [Deploying the Stack](#deploying-the-stack)
- [Configuring Queue](#configuring-queue)
- [Deployment](#deployment)

## Sequence Diagram

The primary use case for hosting images of TCA certificates is for sharing them on social media.

The sequence diagram below explains both the process of creating images and the process for sharing the certificates themselves on social media.

![TCA Certificate Social Sharing ](docs/TCASocialSharing.png?raw=true "TCA Certificate Social Sharing")

>**NOTE:** This diagram was generated using [https://sequencediagram.org](https://sequencediagram.org) with the source located at `./docs/TCASocialSharing.txt`.

## Deploying the stack

The yaml located at `./certificate-image-generator.yml` is the CloudFormation resources configuration and includes all the requirements for creating the stack for the Image Generator on AWS.

There is a helper bash script at `./deploy-stack.sh` that will generate the `aws cloudformation` command for the stage specified. It will also [re-deploy any serverless functions](#deploy-changes-to-generator).

The script requires a stage argument that will be added as a suffix to the Stack and dependent service names.

There is also a helper package script called `cert-gen:deploy-stack` to make it even easier.

```
% npm run cert-gen:deploy-stack myStage

> topcoder-learning-paths-api@1.0.0 cert-gen:deploy-stack
> sh src/utils/certificate-image-generator/deploy-stack.sh "myStage"

Stage: myStage
Stack name: TCA-Certificate-Generator-myStage
Queue name: tca-certificate-generator-sqs-myStage
Bucket name: tca-certificate-generator-s3-myStage
CDN domain: tca-certificate-generator-s3-myStage.s3.amazonaws.com
```

<b>There are also a couple checks in the script that you can silence by adding a 2nd argument of `Y`.<b>

```
% npm run cert-gen:deploy-stack myStage Y
```

### Deploying the Queue with local envioronment variables

Here are the environment variables that must be set in order to create the stack:

```
# The domain at which the cert images will be hosted. The deploy-stack script will
# create a Route 53 record for this cert
CERT_IMAGE_DOMAIN=topcoder-dev.com

```
### Deploy Changes to Generator

Changes to the serverless functions required to create and serve images are automatically
deployed every time the deploy-stack script is run, even if there are no other changes.

## Configuring API

In order to send data to the queue, you'll need to add the following environment variables:

```
# The bucket in which cert images should be stored
CERT_BUCKET=tca-certificate-generator-s3-dev

# The subdomain of the alias for the CDN in which the images are stored.
# This will combine w/the CERT_IMAGE_DOMAIN to create the FQDN for the image.
# This should follow the pattern of `tca-myStage` for all stages.
CERT_IMAGE_SUBDOMAIN=tca-dev

# The URL for the queue that was created from the deploy-stack script.
CERT_IMAGE_QUEUE=https://sqs.us-east-1.amazonaws.com/811668436784/tca-certificate-generator-sqs
```
