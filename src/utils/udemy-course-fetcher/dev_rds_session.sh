#!/bin/zsh

# This script sets up local port forwarding for the standard PostgreSQL database 
# port 5432 to a publicly-accessible EC2 instance (i-6dcceb8c) in the AWS dev account. 
#
# You must also run socat in a terminal session on that instance, which can be done
# via the web-based Secure Session Manager (SSM) terminal session in the AWS console.
# On that host, switch to the ec2-user account:
#    $ sudo su - ec2-user
# Then issue the socat command for the DNS address of the database instance and port, 
# for example:
#    $ sudo socat TCP-LISTEN:5432,reuseaddr,fork TCP4:udemy-course-dev.ci8xwsszszsw.us-east-1.rds.amazonaws.com:5432
# 
# With socat running on the EC2 instance and ssm port-forwarding running locally, you 
# should be able to point your local DB tool (for example, PGAdmin) to a DB instance 
# running on localhost. If you have a local DB server running on the port your forwarding 
# to EC2 you'll need to shut it down before running this script. If you don't, you'll 
# either get an error that something is already bound to the port (self-explanatory) 
# or you'll simply connect to the local instance of the database, not the RDS instance,
# which can be non-obvious.
#
# Also note that your AWS RDS instance needs to be in the same VPC as the EC2 jump host,
# otherwise socat won't be able to connect to it. If you don't specify VPC settings for 
# your RDS instance it will be configured on the default VPC.

aws ssm start-session \
    --profile 811668436784_AWSPowerUserPlusIAM \
    --region us-east-1 \
    --target i-6dcceb8c \
    --document-name AWS-StartPortForwardingSession \
    --parameters '{"portNumber":["5432"],"localPortNumber":["5432"]}'

