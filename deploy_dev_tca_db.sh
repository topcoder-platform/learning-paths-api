#!/bin/zsh

# Shell script that uses serverless (shortcut: sls) to deploy 
# the Topcoder Academy dev env PG database

source ./serverless-resource/.dev.env
sls deploy --aws-profile 811668436784_AWSPowerUserPlusIAM  --stage dev
