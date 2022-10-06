# Topcoder Learning Paths API

This microservice provides access to and interaction with Topcoder Academy learning path certification and course content.

## Devlopment status
[![Total alerts](https://img.shields.io/lgtm/alerts/g/topcoder-platform/learning-paths-api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/topcoder-platform/learning-paths-api/alerts/)[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/topcoder-platform/learning-paths-api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/topcoder-platform/learning-paths-api/context:javascript)

### Deployment status
Dev: [![CircleCI](https://circleci.com/gh/topcoder-platform/learning-paths-api/tree/develop.svg?style=svg)](https://circleci.com/gh/topcoder-platform/learning-paths-api/tree/develop) Prod: [![CircleCI](https://circleci.com/gh/topcoder-platform/learning-paths-api/tree/master.svg?style=svg)](https://circleci.com/gh/topcoder-platform/learning-paths-api/tree/master)

## Swagger definition

- TBD

## Intended use
- Production API

## Related repos

- [Frontend App](https://github.com/topcoder-platform/mfe-customer-work)

## Prerequisites
- [NodeJS](https://nodejs.org/en/) (v16)
- [DynamoDB](https://aws.amazon.com/dynamodb/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Configuration

Configuration for the application is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- READONLY: sets the API in read-only mode. POST/PUT/PATCH/DELETE operations will return 403 Forbidden
- LOG_LEVEL: the log level, default is 'debug'
- PORT: the server port, default is 3000
- AUTH_SECRET: The authorization secret used during token verification.
- VALID_ISSUERS: The valid issuer of tokens.
- AUTH0_URL: AUTH0 URL, used to get M2M token
- AUTH0_PROXY_SERVER_URL: AUTH0 proxy server URL, used to get M2M token
- AUTH0_AUDIENCE: AUTH0 audience, used to get M2M token
- TOKEN_CACHE_TIME: AUTH0 token cache time, used to get M2M token
- AUTH0_CLIENT_ID: AUTH0 client id, used to get M2M token
- AUTH0_CLIENT_SECRET: AUTH0 client secret, used to get M2M token
- AMAZON.AWS_ACCESS_KEY_ID: The Amazon certificate key to use when connecting. Use local dynamodb you can set fake value
- AMAZON.AWS_SECRET_ACCESS_KEY: The Amazon certificate access key to use when connecting. Use local dynamodb you can set fake value
- AMAZON.AWS_REGION: The Amazon certificate region to use when connecting. Use local dynamodb you can set fake value
- AMAZON.IS_LOCAL_DB: Use Amazon DynamoDB Local or server
- AMAZON.DYNAMODB_URL: The local url if using Amazon DynamoDB Local
- HEALTH_CHECK_TIMEOUT: health check timeout in milliseconds
- SCOPES: the configurable M2M token scopes, refer `config/default.js` for more details
- M2M_AUDIT_HANDLE: the audit name used when perform create/update operation using M2M token

You can find sample `.env` files inside the `/docs` directory.

## Available commands
1. Drop/delete DynamoDB tables: `npm run drop-tables`
2. Create DynamoDB tables: `npm run create-tables`
3. Seed/Insert data into DynamoDB tables: `npm run seed-tables`
4. Initialize/Clear database in default environment: `npm run init-db`
5. View table data in default environment: `npm run view-data <ModelName>`, ModelName can be `Certification`, `Course`, or `LearningResourceProvider`
6. Start all the depending services for local deployment: `npm run services:up`
7. Stop all the depending services for local deployment: `npm run services:down`
8. Check the logs of all the depending services for local deployment: `npm run services:logs`
9. Initialize the local environments: `npm run local:init`
10. Reset the local environments: `npm run local:reset`


### Notes
- The seed data are located in `src/scripts/seed`

## Local Deployment
0. Make sure to use Node v16+ -- check with command `node -v`. We recommend using [NVM](https://github.com/nvm-sh/nvm) to quickly switch to the right version specified in the included `.nvmrc` file:

   ```bash
   nvm use
   ```

1. 📦 Install npm dependencies

   ```bash
   npm install
   ```

2. ⚙ Local config   
  In the `learning-paths-api` root directory create an `.env` file with the following environment variables. Values for **Auth0 config** should be shared with you on the forum.<br>
     ```bash
     # Auth0 config
     AUTH0_URL=
     AUTH0_PROXY_SERVER_URL=
     AUTH0_AUDIENCE=
     AUTH0_CLIENT_ID=
     AUTH0_CLIENT_SECRET=

     # Locally deployed services (via docker-compose)
     IS_LOCAL_DB=true
     DYNAMODB_URL=http://localhost:8000
     ```

    - Values from this file would be automatically used by many `npm` commands.
    - ⚠️ Never commit this file or its copy to the repository!

3. 🚢 Use docker-compose to start the services required to run the API locally (DynamoDB).

   ```bash
   npm run services:up
   ```

4. ♻ Create empty DynamoDB tables.

   ```bash
   npm run create-tables
   # Use `npm run drop-tables` to drop tables.
   ```

5. ♻ Initialize the local database.

   ```bash
   npm run local:init
   ```

   This command will do 2 things:
  - Initialize the database by deleting all the existing records.
  - Seed the database with data from the JSON seed files

7. 🚀 Start the learning paths API. 

   ```bash
   npm start
   ```
   The Topcoder Learning Paths API will be served on `http://localhost:3000`<br/>
   To start with ExpressJS debug logging turned on, run `npm start:debug`.

## Production deployment

- TBD

## Running tests

### Configuration

Test configuration is at `config/test.js`. You don't need to change them.
The following test parameters can be set in config file or in env variables:

- ADMIN_TOKEN: admin token
- COPILOT_TOKEN: copilot token
- USER_TOKEN: user token
- EXPIRED_TOKEN: expired token
- INVALID_TOKEN: invalid token
- M2M_FULL_ACCESS_TOKEN: M2M full access token
- M2M_READ_ACCESS_TOKEN: M2M read access token
- M2M_UPDATE_ACCESS_TOKEN: M2M update (including 'delete') access token

### Prepare
- Start Local services in docker.
- Create DynamoDB tables.
- Various config parameters should be properly set.

Seeding db data is not needed.

### Running unit tests
To run unit tests alone

```bash
npm run test
```

To run unit tests with coverage report

```bash
npm run test:cov
```

### Running integration tests
To run integration tests alone

```bash
npm run e2e
```

To run integration tests with coverage report

```bash
npm run e2e:cov
```

## Verification
Refer to the verification document `Verification.md`

## Utilities

Several utilties exist to support this API. Read more about them their READMEs.

[Completed Certificate Sharing](/src/utils/certificate-sharing/README.md)

[Course Generator](/src/utils/course-generator/README.md)

[MongoDB Trigger Handler](/src/utils/mongodb-trigger-handler/README.md)

## Notes

