#!/bin/zsh

# Shell script that uses serverless (shortcut: sls) to deploy 
# the Udemy Course fetcher function

source ./.dev.env
sls deploy --aws-profile 811668436784_AWSPowerUserPlusIAM  --stage dev