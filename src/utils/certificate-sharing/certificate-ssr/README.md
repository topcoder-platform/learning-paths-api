# TCA Certificate SSR (Serverless Framework Node HTTP API on AWS)

This README demonstrates how to develop and deploy the TCA Certificate SSR function, which is an HTTP API with Node.js running on AWS Lambda and API Gateway using the Serverless Framework.

This serverless function takes in a URL for a certificate image, verifies the image exists, then wraps it in SSR html so that it can be used to share dynamic images.

## Usage

Install packages w/in this directory:

```bash
$ npm i
```

### Deployment

Copy/paste the AWS Environment variables into your terminal for the AWS environment to which you wish to deploy.

```
$ npm run deploy
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

You can also visit the URL directly: https://rn73qvj4lf.execute-api.us-east-1.amazonaws.com/?certImageUrl=https%3A%2F%2Ftca-dev.topcoder-dev.com%2Fcertificate%2Fjcori%2Fdata-analysis-with-python.jpg&certImage=Topcoder%20Academy%20Certificate%20for%20Data%20Analysis%20with%20Python%20for%20jcori.

### Local development

It is possible to emulate API Gateway and Lambda locally by using `serverless-offline` plugin. 

```bash
npm run offline
```

To learn more about the capabilities of `serverless-offline`, please refer to its [GitHub repository](https://github.com/dherault/serverless-offline).
