# Topcoder Academy Data Migrator

This utility migrates Topcoder Academy data for freeCodeCamp.org certifications from DynamoDB to PostgreSQL. It assumes that the Postgres database "topcoder-academy" already exists and contains all of the tables and seed data needed.

## Database Setup

The Sequelize ORM is used for managing Postgres data migrations. Its code can be found in [src/db](./src/db). Once the `topcoder-academy` database is created it can be migrated to create all of the tables and other schema items via:
```
npx sequelize-cli db:migrate
```
Note: you may have to add the name of the initial migration file [20230131203207-init-database.js](../../db/migrations/20230131203207-init-database.js) to the `SequelizeMeta` table.

The DB seeder files need to be executed to load lookup data, via:
```
npx sequelize-cli db:seed:all
```

Note: There is a seed file used for local development [20221215001514-seed-fcc-certs.js](../../db/seeders/20221215001514-seed-fcc-certs.js) that will pre-seed the FCC certifications. This will cause problems when FCC certifications are loaded. Just truncate the `FreeCodeCampCertification` table before running the migration.

set DYNAMODB_URL
load AWS env vars
