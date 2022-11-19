# LADR 03-initial-database-migration - Nov 7, 2022

The database that was created in AWS via the serverless deployment is initially empty. Using the Prisma ORM tool the database needs to be migrated to the current state defined by the collection of migration files in the [prisma/migrations directory](../../prisma/migrations/). The migration process for the deployed database is described in the [Prisma documentation](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-lambda#2-set-the-database_url-environment-variable-locally).

In order to connect to the Postgres instance deployed in AWS RDS you must setup two remote connections:
1. An AWS SSM connection from your local machine to the NAT (jump) host in the target AWS environment
2. `socat` port forwarding from the NAT host in AWS to the AWS RDS instance

There is a script in this project [dev_rds_session.sh](../../dev_rds_session.sh) that takes care of 1) above. The script also contains detailed instructions on setting up the `socat` connection on the NAT host in AWS.

With both 1) and 2) above configured you should be able to execute the Prisma migrations to set up the database.

