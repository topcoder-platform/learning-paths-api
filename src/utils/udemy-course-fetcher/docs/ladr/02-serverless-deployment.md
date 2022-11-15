# LADR 02-serverless-deployment - Nov 4, 2022

This function uses the [`serverless`](https://serverless.com) framework to manage deployments to AWS.

### Key issues:
- This code uses the [Prisma](https://prisma.io) ORM framework, which requires specific considerations when deploying to code to an AWS Lambda. See the 'caveats' in [the Prisma documentation](https://www.prisma.io/docs/guides/deployment/deployment-guides/caveats-when-deploying-to-aws-platforms).
- These caveats require us to provide the AWS Lambda runtime-compatible Prisma client binaries. These are specified in the [schema.prisma](../../prisma/schema.prisma) file by adding the "rhel-openssl-*" binary target:
```
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}
```
Once this target is added you have to regenerate the client code via the CLI command:
```
$ npx prisma generate
```
- We also should remove large binary files from the serverless deployment package that are not required in AWS. This is done in the [serverless.yml](../../serverless.yml) file using the `package` directive. A prefix with `!` causes the file or directory to be excluded from the zipped package that is uploaded to AWS:
```
package:
  patterns:
    - '!node_modules/@prisma/engines/**'
    - '!node_modules/.prisma/client/libquery_engine-darwin-arm64.dylib.node'
    ...
```