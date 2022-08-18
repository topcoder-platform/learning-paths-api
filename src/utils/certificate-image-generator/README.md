# TCA Certificate Image Generator

This utility creates an image of each certficate as it's earned so that the image can be used in SSR meta tags.

- [Sequence Diagram](#sequence-diagram)
- [Creating the Stack](#creating-the-stack)
- [Configuring Queue](#configuring-queue)
- [Deployment](#deployment)

## Sequence Diagram

The primary use case for hosting images of TCA certificates is for sharing them on social media.

The sequence diagram below explains both the process of creating images and the process for sharing the certificates themselves on social media.

![TCA Certificate Social Sharing ](docs/TCASocialSharing.png?raw=true "TCA Certificate Social Sharing")

>**NOTE:** This diagram was generated using [https://sequencediagram.org](https://sequencediagram.org) with the source located at `./docs/TCASocialSharing.txt`.

## Creating the stack

The yaml located at `./certificate-image-generator.yml` is the CloudFormation resources configuration and includes all the requirements for creating the stack for the Image Generator on AWS.

There is a helper bash script at `./create-stack.sh` that will generate the `aws cloudformation` command for the environment specified.

The script supports an environment argument that will be added as a suffix to the Stack and dependent service names.

If no environment is provided, the default names will be used, and the script will likely fail bc resources with the default names already exist.

There is also a helper package script called `cert-gen:create-stack` to make it even easier.

<b>with environment</b>

```
% npm run cert-gen:create-stack -- myEnv

> topcoder-learning-paths-api@1.0.0 cert-gen:create-stack
> sh src/utils/certificate-image-generator/create-stack.sh "myEnv"

Environment: myEnv
Stack name: TCA-Certificate-Generator-myEnv
Queue name: tca-certficate-generator-myEnv
```

<b>without environment</b>

```
% npm run cert-gen:create-stack

> topcoder-learning-paths-api@1.0.0 cert-gen:create-stack
> sh src/utils/certificate-image-generator/create-stack.sh

Environment: No Env
Stack name: TCA-Certificate-Generator
Queue name: tca-certficate-generator
```

## Configuring Queue

In order to send messages to the queue, you'll need to add the following 2 environment variables:

```
% export PLATFORM_URL=https://platform-ui.topcoder-dev.com
% export QUEUE_URL=https://sqs.us-east-1.amazonaws.com/811668436784/
```

## Deployment

TODO
