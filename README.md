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
- USE_KEYCLOAK: M2M provider switch; `true` uses the KEYCLOAK_* settings, unset/empty/`false` uses the AUTH0_* settings (see "Provider switch: USE_KEYCLOAK")
- AUTH0_URL: AUTH0 URL, used to get M2M token when USE_KEYCLOAK is not true
- AUTH0_PROXY_SERVER_URL: AUTH0 proxy server URL, used by the Bus wrapper to get M2M token when USE_KEYCLOAK is not true
- AUTH0_AUDIENCE: AUTH0 audience, used to get M2M token when USE_KEYCLOAK is not true (default `https://www.topcoder-dev.com`)
- TOKEN_CACHE_TIME: AUTH0 token cache time, passed to the Bus wrapper when USE_KEYCLOAK is not true
- AUTH0_CLIENT_ID: AUTH0 client id, used to get M2M token when USE_KEYCLOAK is not true
- AUTH0_CLIENT_SECRET: AUTH0 client secret, used to get M2M token when USE_KEYCLOAK is not true
- KEYCLOAK_ISSUER: Keycloak realm issuer, required when USE_KEYCLOAK=true
- KEYCLOAK_AUDIENCE: Keycloak audience, required when USE_KEYCLOAK=true
- KEYCLOAK_TOKEN_URL: Keycloak managed token endpoint, required when USE_KEYCLOAK=true
- KEYCLOAK_CLIENT_ID: Keycloak client id, used to get M2M token when USE_KEYCLOAK=true
- KEYCLOAK_CLIENT_SECRET: Keycloak client secret, used to get M2M token when USE_KEYCLOAK=true
- KEYCLOAK_SCOPE: optional requested Keycloak scope subset when USE_KEYCLOAK=true
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
     # M2M provider: true = Keycloak, false or empty = Auth0
     USE_KEYCLOAK=

     # Auth0 config (USE_KEYCLOAK not true)
     AUTH0_URL=
     AUTH0_PROXY_SERVER_URL=
     AUTH0_AUDIENCE=
     AUTH0_CLIENT_ID=
     AUTH0_CLIENT_SECRET=

     # Keycloak config (USE_KEYCLOAK=true)
     KEYCLOAK_ISSUER=
     KEYCLOAK_AUDIENCE=
     KEYCLOAK_TOKEN_URL=
     KEYCLOAK_CLIENT_ID=
     KEYCLOAK_CLIENT_SECRET=
     KEYCLOAK_SCOPE=

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

Several utilities exist to support this API. Read more about them on their READMEs.

[Completed Certificate Sharing](/src/utils/certificate-sharing/README.md)

[Course Generator](/src/utils/course-generator/README.md)

[MongoDB Trigger Handler](/src/utils/mongodb-trigger-handler/README.md)

## Notes


## Keycloak migration branch

This branch pins shared core 4.0.0-keycloak.2 at
`112d54a3ed66423e7305e94e174937823e76124e` in the API, Bus wrapper, and separately
packaged MongoDB trigger.

### Provider switch: USE_KEYCLOAK

`USE_KEYCLOAK=true` makes the API get its M2M tokens from Keycloak, using
`KEYCLOAK_TOKEN_URL`, `KEYCLOAK_AUDIENCE`, `KEYCLOAK_CLIENT_ID` and
`KEYCLOAK_CLIENT_SECRET` (optional `KEYCLOAK_SCOPE` narrows the client's defaults).
`KEYCLOAK_ISSUER` is also required. Shared core validates RS256
issuer/audience/time/client/scope and caches only verified service tokens.
Unset or `false` restores the Auth0 behaviour from before the migration:

- Outbound API calls (`getM2MToken`) post to `AUTH0_URL` with `AUTH0_AUDIENCE`
  (default `https://www.topcoder-dev.com`), `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET`.
- The Bus wrapper uses `AUTH0_URL`, `AUTH0_AUDIENCE`, `AUTH0_PROXY_SERVER_URL`,
  `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` and `TOKEN_CACHE_TIME`.

`tc-core-library-js` reads the flag (`auth.useKeycloak`), and the Bus wrapper gets its
settings from `auth.wrapperSettings`, so the service and the core always agree. Any
value other than `true`/`false` fails at startup. The ECS deploy loads
`/config/learning-paths-api/appvar` and `/config/common/global-appvar`, so in DEV the
flag is `/config/common/global-appvar/USE_KEYCLOAK`. The MongoDB trigger Lambda has its
own flag (see its README).

Incoming machine tokens: with `true`, Keycloak tokens are accepted, plus Auth0 tokens
while `LEGACY_M2M_ISSUERS`/`LEGACY_M2M_AUDIENCE` are set. With `false`, Auth0 tokens
are accepted through `LEGACY_M2M_*`, plus Keycloak tokens while `KEYCLOAK_ISSUER` and
`KEYCLOAK_AUDIENCE` are set, so callers that have not switched yet keep working.

**Rollback:** set `USE_KEYCLOAK=false` and force a new deployment so tasks re-read SSM.
No code or dependency change is needed. Keep the Auth0 settings above in SSM until
Keycloak has been accepted. The core never retries a failed Keycloak request against
Auth0; rolling back is always this explicit change.

### Inbound authorization

Inbound services can use only the explicitly scoped MongoDB trigger route with
`update:certification_progress`; personal progress/enrollment/payment/admin
routes remain member-only. Service identities never receive a member handle or
user ID. Members retain role/ownership checks, with `AUTH_SECRET`,
`VALID_ISSUERS`, and either explicit `AUTH_USER_AUDIENCES` (JSON array) or
`ALLOW_LEGACY_USER_AUDIENCE=true` configured for legacy member sessions.
Public routes retain anonymous access if a supplied token is invalid.

Outbound API clients need Member/Identity/Skills read and `write:bus_api` permissions as
used by their workflows. The MongoDB Lambda needs only
`update:certification_progress`. Configure each workload separately before any
future rollout. CI excludes `keycloak_m2M`; no application/Lambda deployment
is performed. Validation: `pnpm lint`, `pnpm build`, `pnpm test:keycloak` (both
providers); run `nvm use`, `npm run lint`, `npm run build`, `npm test` in the nested
trigger package. Tests use signed fixtures and mocked downstream transports.

The Bus wrapper retains legacy `AUTH0_*` option names internally; `auth.wrapperSettings`
fills them from the Keycloak settings when `USE_KEYCLOAK=true` and from the Auth0
settings otherwise. Its nested core is pinned to the same immutable version.
