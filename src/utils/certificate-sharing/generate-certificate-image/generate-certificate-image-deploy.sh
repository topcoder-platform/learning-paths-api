#!/bin/bash

# load in the environment variables
set -a
. ../../../../.env
set +a

# validate the environment variables
if [[ -z $CERT_IMAGE_DOMAIN ]]
    then
        echo CERT_IMAGE_DOMAIN is required
        exit 1
fi

# get the stage
stage=$1
if [[ -z $stage ]]
    then
        echo Enter name of stage:
        read STAGE
        stage=$STAGE
fi

# if we didn't get a stage, we can't deploy
if [[ -z $stage ]]
    then
        echo Stage is required. Cancelling deployment.
        exit 2
fi

# get the stack and queue names
stackName=TCA-Certificate-Generator-$stage
template=certificate-image-generator.yml
echo "Template: $template"
echo "Stage: $stage"
echo "Stack name: $stackName"
echo "Image Store Domain: $CERT_IMAGE_DOMAIN"

# approve the deployment
silent=$2
if [[ -z $silent ]]
    then
        echo "Are you sure you want to deploy? Y/n"
        read SILENT
        silent=$SILENT
fi

if [[ $silent != "Y" ]]
    then
        echo "Deployment cancelled"
        exit 3
fi

# Deploy (i.e. create or update) the stack w/the params
aws cloudformation deploy \
    --stack-name $stackName \
    --template-file $template \
    --parameter-overrides \
        Stage=$stage \
        ImageStoreDomain=$CERT_IMAGE_DOMAIN

# Create the lambda deployment package 
deployZip=deploy.zip
deployYml=deploy.yml
aws cloudformation package \
    --template-file $template \
    --s3-bucket tca-certificate-generator-s3-$stage \
    --output-template-file $deployYml

# Package the lambda code
zip -r $deployZip handler.js

# Deploy the lambda changes
aws lambda update-function-code \
    --function-name tca-certificate-generator-lambda-generate-image-$stage \
    --zip-file fileb://$deployZip

# Clean up after the lambda changes
rm $deployZip
rm $deployYml
