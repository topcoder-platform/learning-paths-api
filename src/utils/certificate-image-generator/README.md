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

There is a helper bash script at `./deploy-stack.sh` that will generate the `aws cloudformation` command for the stage specified.

The script supports a stage argument that will be added as a suffix to the Stack and dependent service names.

If no stage is provided, the default names will be used.

There is also a helper package script called `cert-gen:deploy-stack` to make it even easier.

<b>with stage</b>

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

<b>without stage</b>

```
% npm run cert-gen:deploy-stack

> topcoder-learning-paths-api@1.0.0 cert-gen:deploy-stack
> sh src/utils/certificate-image-generator/deploy-stack.sh

Stage:
Stack name: TCA-Certificate-Generator
Queue name: tca-certificate-generator-sqs
Bucket name: tca-certificate-generator-s3
CDN domain: tca-certificate-generator-s3.s3.amazonaws.com
Alias: tca.topcoder-dev.com
```

<b>There are also a couple checks in the script that you can silence by adding a 2nd argument of `Y`.<b>

```
% npm run cert-gen:deploy-stack myStage Y
```
<b>or without an stage specified:<b>
```
% npm run cert-gen:deploy-stack "" Y
```

### Deploying the Queue with local envioronment variables

There are some environment variables that must be set in order to create the stack:

```
# The domain at which the cert images will be hosted. The deploy-stack script will
# create a Route 53 record for this cert
CERT_IMAGE_ALIAS=tca.topcoder-dev.com 

# The cert for the domain defined in the alias. This can be found in the Route 53
# record for the selected wildcard domain (e.g. *.topcoder-dev.com).
CERT_IMAGE_CERT_ARN=arn:aws:acm:us-east-1:811668436784:certificate/8e56f24a-1eaf-4289-8c21-db2c0761ecf4

# The hosted zone ID for the alias. Because the alias is for a Cloudfront distribution, 
# it uses the generic ID for all Cloudfront distributions as described in the link below.
CERT_IMAGE_HOSTED_ZONE_ID=Z2CIRG3R0ZSGFQ
```

[Cloudfront Hosted Zone Id](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-route53-aliastarget.html#cfn-route53-aliastarget-hostedzoneid)


## Configuring Queue

In order to send messages to the queue, you'll need to add the following environment variables:

```
# The URL for the queue that was created from the deploy-stack script.
CERT_IMAGE_QUEUE=https://sqs.us-east-1.amazonaws.com/811668436784/tca-certificate-generator-sqs
```

## Deploy Changes to Generator

TODO
