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

There is a helper bash script at `./deploy-stack.sh` that will generate the `aws cloudformation` command for the environment specified.

The script supports an environment argument that will be added as a suffix to the Stack and dependent service names.

If no environment is provided, the default names will be used, and the script will likely fail bc resources with the default names already exist.

There is also a helper package script called `cert-gen:deploy-stack` to make it even easier.

<b>with environment</b>

```
% npm run cert-gen:deploy-stack myEnv

> topcoder-learning-paths-api@1.0.0 cert-gen:deploy-stack
> sh src/utils/certificate-image-generator/deploy-stack.sh "myEnv"

Environment: myEnv
Stack name: TCA-Certificate-Generator-myEnv
Queue name: tca-certificate-generator-sqs-myEnv
Bucket name: tca-certificate-generator-s3-myEnv
CDN domain: tca-certificate-generator-s3-myEnv.s3.amazonaws.com
Alias: tca.topcoder-dev.com
HostedZoneId: ######
acmCertificateArn: ######
```

<b>without environment</b>

```
% npm run cert-gen:deploy-stack

> topcoder-learning-paths-api@1.0.0 cert-gen:deploy-stack
> sh src/utils/certificate-image-generator/deploy-stack.sh

Environment: No Env
Stack name: TCA-Certificate-Generator
Queue name: tca-certificate-generator-sqs
Bucket name: tca-certificate-generator-s3
CDN domain: tca-certificate-generator-s3.s3.amazonaws.com
Alias: tca.topcoder-dev.com
HostedZoneId: ######
acmCertificateArn: ######
```

<b>There are also a couple checks in the script that you can silence by adding a 2nd argument of `Y`.<b>

```
% npm run cert-gen:deploy-stack myEnv Y
```
<b>or without an envioronment specified:<b>
```
% npm run cert-gen:deploy-stack "" Y
```

## Configuring Queue

In order to send messages to the queue, you'll need to add the following environment variables:

```
CERT_IMAGE_QUEUE=https://sqs.us-east-1.amazonaws.com/811668436784/tca-certificate-generator-sqs
CERT_IMAGE_ALIAS=tca.topcoder-dev.com
CERT_IMAGE_HOSTED_ZONE_ID=Z2CIRG3R0ZSGFQ
CERT_IMAGE_CERT_ARN=arn:aws:acm:us-east-1:811668436784:certificate/8e56f24a-1eaf-4289-8c21-db2c0761ecf4
```

## Deploy Changes to Generator

TODO
