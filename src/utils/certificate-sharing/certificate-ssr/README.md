<!--
title: 'AWS Simple HTTP Endpoint example in NodeJS'
description: 'This template demonstrates how to make a simple HTTP API with Node.js running on AWS Lambda and API Gateway using the Serverless Framework.'
layout: Doc
framework: v3
platform: AWS
language: nodeJS
authorLink: 'https://github.com/serverless'
authorName: 'Serverless, inc.'
authorAvatar: 'https://avatars1.githubusercontent.com/u/13742415?s=200&v=4'
-->

# Serverless Framework Node HTTP API on AWS

This template demonstrates how to make a simple HTTP API with Node.js running on AWS Lambda and API Gateway using the Serverless Framework.

This template does not include any kind of persistence (database). For more advanced examples, check out the [serverless/examples repository](https://github.com/serverless/examples/) which includes Typescript, Mongo, DynamoDB and other examples.

## Usage

Install packages w/in this directory:

```bash
$ npm i
```

### Deployment

```
$ sls deploy
```

After deploying, you should see output similar to:

```bash
Deploying tca-certificate-ssr to stage dev (us-east-1)

✔ Service deployed to stack tca-certificate-ssr-dev (152s)

endpoint: GET - https://rn73qvj4lf.execute-api.us-east-1.amazonaws.com/
functions:
  ssr: tca-certificate-ssr-dev-ssr (1.9 kB)
```

_Note_: The API is public and can be invoked by anyone.

### Invocation

After successful deployment, you can call the created application via HTTP:

```bash
curl https://rn73qvj4lf.execute-api.us-east-1.amazonaws.com/\?certImageUrl=https%3A%2F%2Ftca-dev.topcoder-dev.com%2Fcertificate%2Fjcori%2Fdata-analysis-with-python.jpg&certImage=Topcoder%20Academy%20Certificate%20for%20Data%20Analysis%20with%20Python%20for%20jcori
```

Which should result in response similar to the following (removed `input` content for brevity):

```html
<html><head>    <title>Topcoder Academy Certificate</title>    <meta property='og:image' content='https://tca-dev.topcoder-dev.com/certificate/jcori/data-analysis-with-python.jpg' />    <style>        body {            display: flex;            justify-content: center;            height: 95%;            background: linear-gradient(84.45deg, #05456d 2.12%, #0a7ac0 97.43%);        }        div {            display: flex;            flex-direction: column;            justify-content: center;        }    </style></head><body>    <div>        <img src='https://tca-dev.topcoder-dev.com/certificate/jcori/data-analysis-with-python.jpg' />    </div></body></html>
```

### Local development

It is possible to emulate API Gateway and Lambda locally by using `serverless-offline` plugin. 

```bash
sls offline
```

To learn more about the capabilities of `serverless-offline`, please refer to its [GitHub repository](https://github.com/dherault/serverless-offline).
