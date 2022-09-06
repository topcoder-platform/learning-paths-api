#!/bin/bash

# load in the environment variables
set -a
. ../../../.env
set +a

# validate the environment variables
if [[ -z $CERT_IMAGE_ALIAS ]]
    then
        echo CERT_IMAGE_ALIAS is required
        exit 1
fi
if [[ -z $CERT_IMAGE_HOSTED_ZONE_ID ]] 
    then
        echo CERT_IMAGE_HOSTED_ZONE_ID is required
        exit 1
fi
if [[ -z $CERT_IMAGE_CERT_ARN ]] 
    then
        echo CERT_IMAGE_CERT_ARN is required
        exit 1
fi

# get the stage
stage=$1
silent=$2
if [[ -z $silent ]]
    then
        if [[ -z $stage ]]
            then
                echo "Enter name of stage:"
                read STAGE
                stage=$STAGE
        fi
    else
        if [[ $silent != "Y" ]]
            then 
                echo "Aborting deployment bc the silent argument can only be Y: " $silent
                exit 2
            else
                echo "Deploying silently... "
        fi
fi

# get the stack and queue names
template=certificate-image-generator-stack.yml
stackName=TCA-Certificate-Generator
queueName=tca-certificate-generator-sqs
bucketName=tca-certificate-generator-s3
genCertFunction=tca-certificate-generator-lambda-generate-image

# if there is a non-empty stage argument, add it as a suffix
if [[ -n $stage ]] && [[ $stage != "" ]]
    then
        stackName=$stackName-$stage
        queueName=$queueName-$stage
        bucketName=$bucketName-$stage
        genCertFunction=$genCertFunction-$stage
fi
cdnDomain=$bucketName.s3.amazonaws.com

echo "Template: $template"
echo "Stage: $stage"
echo "Stack name: $stackName"
echo "Queue name: $queueName"
echo "Bucket name: $bucketName"
echo "CDN domain: $cdnDomain"
echo "Generate Cert Image Function: $genCertFunction"
echo "Alias: $CERT_IMAGE_ALIAS"
echo "HostedZoneId: $CERT_IMAGE_HOSTED_ZONE_ID"
echo "acmCertificateArn: $CERT_IMAGE_CERT_ARN"

# approve the deployment
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
        TCAGenerateCertificateQueueName=$queueName \
        TCACertificateImageStoreName=$bucketName \
        TCACertificateImageStoreDomain=$cdnDomain \
        TCACertificateImageStoreAlias=$CERT_IMAGE_ALIAS \
        TCACertificateImageStoreCdnCertArn=$CERT_IMAGE_CERT_ARN \
        TCACertificateImageStoreAliasHostedZoneId=$CERT_IMAGE_HOSTED_ZONE_ID \
        TCACertificateImageGeneratorFunctionName=$genCertFunction \


# Create the lambda deployment package 
aws cloudformation package \
    --template-file $template \
    --s3-bucket $bucketName \
    --output-template-file $genCertFunction.yml

# Package the lambda code
cd ./generate-certificate-image
zip -r $genCertFunction.zip index.js
cp $genCertFunction.zip ../
rm $genCertFunction.zip 
cd ../

# Deploy the lambda changes
aws lambda update-function-code \
    --function-name $genCertFunction \
    --zip-file fileb://$genCertFunction.zip

# Clean up after the lambda changes
rm $genCertFunction.zip
rm $genCertFunction.yml
