# Certificate Sharing Errors Serverless (Lambda)

This function subscribes to the logs for the functions below and sends all error logs to the subscription email [TBD].

tca-certificate-ssr-[stage]
tca-certificate-generator-lambda-generate-image-[stage]

## Usage

### Deployment

In order to deploy the example, you need to run the following command:

```
$ sls deploy
```

After running deploy, you should see output similar to:

```bash
Deploying tca-certificate-sharing-errors to stage dev (us-east-1)

✔ Service deployed to stack tca-certificate-sharing-errors-dev (40s)

functions:
  errors: tca-certificate-sharing-errors-prod-errors (2.6 kB)
```

### Invocation

After successful deployment, you can invoke the deployed function by using the following command:

```bash
sls invoke --function errors
```

Which will result in an error bc there is no payload.

```json
{
    "errorMessage": "'awslogs'",
    "errorType": "KeyError",
    "stackTrace": [
        "  File \"/var/task/handler.py\", line 79, in lambda_handler\n    pload = logpayload(event)\n",
        "  File \"/var/task/handler.py\", line 31, in logpayload\n    logger.debug(event['awslogs']['data'])\n"
    ]
}
```

### Local development

You can invoke your function locally by using the following command:

```bash
sls invoke local --function errors
```

### Bundling dependencies

In case you would like to include third-party dependencies, you will need to use a plugin called `serverless-python-requirements`. You can set it up by running the following command:

```bash
serverless plugin install -n serverless-python-requirements
```

Running the above will automatically add `serverless-python-requirements` to `plugins` section in your `serverless.yml` file and add it as a `devDependency` to `package.json` file. The `package.json` file will be automatically created if it doesn't exist beforehand. Now you will be able to add your dependencies to `requirements.txt` file (`Pipfile` and `pyproject.toml` is also supported but requires additional configuration) and they will be automatically injected to Lambda package during build process. For more details about the plugin's configuration, please refer to [official documentation](https://github.com/UnitedIncome/serverless-python-requirements).
