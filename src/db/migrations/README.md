# Initializing the Topcoder Academy database

The Topcoder Academy PostgreSQL database must be initialized, migrated, seeded, and loaded with data to be used with the API. This document explains the steps that must be taken to properly setup the database.

## Migrations 

This [/migrations](./) folder contains Sequelize migration files that set up and modify the database schema. The [init-database.sql](init-database.sql) file contains the bulk of the schema creation with the other migrations making smaller modifications to it.

### Preconditions to running migrations

- You must have access to a Postgres ~v14 instance running locally, or remotely in AWS with proper port forwarding setup (see [this script](../../utils/tca-data-migrator/dev_rds_session.sh) for info on how to set that up).
- The `topcoder_academy` database needs to exist -- the migration script does not create it.
- You also need to have the following env vars setup. You need to get the proper password for the AWS RDS instance if connecting to the remote DB:

```
export TCA_PG_USER='postgres'
export TCA_PG_PASSWORD='postgres'
export TCA_PG_DATABASE='topcoder_academy'
export TCA_PG_HOST='localhost'
```

### Executing migrations

Assuming you have installed all of the npm packages required by this project you should have the `sequelize-cli` installed. The command to run the database migrations is:
```
npx sequelize-cli db:migrate
```

There appears to be a bug in Sequelize or the way we're doing this initial migration that results in an error saying the `'SequelizeMeta table doesn't exist'` and the output indicates none of the migrations successfully ran. If you check the database the `SequelizeMeta` table will exist but it won't contain any data. To fix this, add an entry to the table for the first migration, `20230131203207-init-database.js` so that Sequelize knows it was already run. Re-run the migration command and all of the migrations should succeed.

# Seeders
Sequelize provides a mechanism to "seed" data in the database. We have a few [seeders](../seeders/) defined to load basic lookup data, so you need to run these.

### Run the seeders 

Once the database has been migrated, run the seeders:

```
npx sequelize-cli db:seed:all
```

## Load dev data

The data required to run the application needs to be loaded from an existing copy of the freeCodeCamp data that exists in the development environment.

## Using the data

With all of these actions completed you should have a full set of Topcoder Academy data loaded into Postgres. There will be two certfifications defined in the `TopcoderCertification` table, thanks to the `20221214231807-seed-topcoder-certifications` seeder. However, these certifications cannot be used until a collection of certification resources (in our case, FreeCodeCamp certifications) are associated with the certifications.

To enable using these certifications out of the box, a seeder file was created in the [seeders/after_data_loaded](../seeders/after_data_loaded/) directory to associate the resources with the certifications. Since this seeder is out of the normal seeder path it won't normally be executed. To execute this seeder, use the following command:
```
npx sequelize-cli db:seed --seeders-path src/db/seeders/after_data_loaded --seed 20230210213337-add-certification-resources.js
```

With all of these steps completed you should be able to hit the API via Postman and to run the platform-ui Learn application.