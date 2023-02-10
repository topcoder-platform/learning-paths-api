# Initilizing the Topcoder Academy database

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

The data required to run the application needs to be loaded from an existing copy of the freeCodeCamp data that exists in the development environment or in your local DynamoDB instance if you've loaded it with data. Two utilities, exposed as npm scripts, assist with this.

### Migrate data from DynamoDB to Postgres

To migrate data from DynamoDB into Postgres you have to supply the DYNAMODB_URL env var. 

- For a local instance of DynamoDB: `export DYNAMODB_URL=http://localhost:8000`
- For an AWS instance of DynamoDB: `export DYNAMODB_URL=https://dynamodb.us-east-1.amazonaws.com`

When connecting to an AWS DynamoDB instance you will also need to supply your AWS credentials as env vars in the terminal from which you run the migration scripts. Copy them from the AWS account selection page and paste them into your terminal, for example:
```
export AWS_ACCESS_KEY_ID="ASIA3Z6ZVO4YGAEVZXXX"
export AWS_SECRET_ACCESS_KEY="t/NVVXpPzJmc0KgxNgVbLIItsV/HnZJ8SEnAdxxxx"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjECMaCXVzLWVhc3QtMSJIMEYCIQDgNIT71UtV9+XiLHIdPa9Hw4rM09aj+V9ugWPcH6eZ/gIhAOwq7Du2OlN9R2CaOpj8g+JEmytSThrROM63Js8Miq6PKqQDCKz//////////wEQABoMODExNjY4NDM2Nzg0IgyRGN7hPY8VZx9DWV4q+AKd7ebDDzO1ydpaeNe6PMrADhuaqYCrw7uzKDnxdIKJXh+ufSMppmV+Urso/uncRzrgZ3eRPEULyk6Aj0kl2VCi5248alMay1kpxr5k/INilfq7KbaWdO/JfclD1fJhdVmgV+7ki6QbznAWDCVEcSfg5dAikjnYflEtlxGiAyq2WsTI05z24MV6R8dRRWBsOkOMOulULDbe2LzcfvDggM+Yu+57+A2gIqQebk2lrLwoT671bszJ8HOVMwkHvvlcih788/2zjsX7yXmYpmrpdj2LCbi7zEE2Wv/tCHhbCkbhujbG62zUOHO7M8Ex5hTN9+w6kjSSaqSvEV0BD1+fiOkd5cwz9M5szskrJ7MIDQsQgqaUGvq3C7gB861JCS7IIbY7U9z8/7O7yFL4/QsxSDO7P5y7Ejnajw0+SDutx+8foolzBAsn3K9HRMZU4cqDTB0AguYggcdSLZOUTFr2L5IpZFmLH0g3t5bdeTMu58qJiF/sssss/abdMpAi1NH0OEe9VFqgyuwUUWrl0v6wdUhD3XMPwNEZXJQEQlBin4HKX1z+xI9ebL1ky2hj/A4eiL1XfTs7xIEFjCfSLWAaq3avRVG0uP0vsEIn6Gf6cMQVdVtL99rkeKS"
```

With that setup complete you can run the two scripts, in the order shown:
```
npm run migrate-tca-courses 
npm run migrate-tca-progress
```

There will be a fair amount of output to the console as the SQL queries are executed. You may notice that after the first script seems to complete that it hangs (doesn't exit). I'm not sure what causes this, but once the output has stopped scrolling the script is complete, and you can just exit it via `Ctrl-C`.

## Using the data

With all of these actions completed you should have a full set of Topcoder Academy data loaded into Postgres. There will be two certfifications defined in the `TopcoderCertification` table, thanks to the `20221214231807-seed-topcoder-certifications` seeder. However, these certifications cannot be used until a collection of certification resources (in our case, FreeCodeCamp certifications) are associated with the certifications.

To enable using these certifications out of the box, a seeder file was created in the [seeders/after_data_loaded](../seeders/after_data_loaded/) directory to associate the resources with the certifications. Since this seeder is out of the normal seeder path it won't normally be executed. To execute this seeder, use the following command:
```
npx sequelize-cli db:seed --seeders-path src/db/seeders/after_data_loaded --seed 20230210213337-add-certification-resources.js
```

With all of these steps completed you should be able to hit the API via Postman and to run the platform-ui Learn application.