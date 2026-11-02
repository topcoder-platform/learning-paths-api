#!/bin/bash

# load in the environment variables
set -a
. ../../../../.env
set +a

# validate the environment variables
if [[ -z $CERT_IMAGE_DOMAIN ]]
    then
        echo "CERT_IMAGE_DOMAIN is required"
        exit 1
fi

# get the stage
stage=$1
if [[ -z $stage ]]
    then
        echo "Enter name of stage:"
        read STAGE
        stage=$STAGE
fi

# if we didn't get a stage, we can't deploy
if [[ -z $stage ]]
    then
        echo "Stage is required. Cancelling deployment."
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

echo "Deploy (i.e. create or update) the stack w/the params"

aws cloudformation deploy \
    --stack-name $stackName \
    --template-file $template \
    --parameter-overrides \
        Stage=$stage \
        ImageStoreDomain=$CERT_IMAGE_DOMAIN

echo "Creating the lambda development package..."

deployLog=deploy.txt
deployYml=deploy.yml
deployZip=deploy.zip

aws cloudformation package \
    --template-file $template \
    --s3-bucket tca-certificate-generator-s3-$stage \
    --output-template-file $deployYml

echo "Packaging the lambda code..."

cd ./lambda
nvm use
npm ci --omit=dev
zip -r ../$deployZip . -x 'test/*' '*.log' '.env' '.env.*'
cd ..

# Chromium is bundled with the function, so use S3 for archives exceeding the
# Lambda direct-upload limit. Keep handler.js at the archive root.
deployBucket="tca-certificate-generator-s3-$stage"
deployKey="deployments/certificate-image-$(date -u +%Y%m%dT%H%M%SZ).zip"
aws s3 cp "$deployZip" "s3://$deployBucket/$deployKey"

echo "Deploying the lambda..."

aws lambda update-function-code \
    --function-name tca-certificate-generator-lambda-generate-image-$stage \
    --s3-bucket "$deployBucket" \
    --s3-key "$deployKey" \
    > $deployLog

echo "Cleaning up after the lambda deployment"

rm $deployLog
rm $deployYml
rm $deployZip
