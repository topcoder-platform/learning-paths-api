#!/bin/zsh

# This script sets up local port forwarding for the Informix database at port 2020.

aws ssm start-session \
    --profile 811668436784_AWSPowerUserPlusIAM \
    --region us-east-1 \
    --target i-47bbe1c4 \
    --document-name AWS-StartPortForwardingSession \
    --parameters '{"portNumber":["2020"],"localPortNumber":["2020"]}'

