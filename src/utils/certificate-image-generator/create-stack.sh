#!/bin/bash

# get the env
env=$1
echo $env
if [ -z $env ]
  then
    echo "Enter env name:"
    read ENV
    env=$ENV
fi
echo "Environment: $env"

# get the stack and queue names
stackName="TCA-Certificate-Generator"
queueName="tca-certficate-generator"
if [ -z $env ]
  then
    echo "No env $env"
  else
    stackName="$stackName-$env"
    queueName="$queuName-$env"
fi
echo "Stack name: $stackName"
echo "Queue name: $queueName"

# read in the template body
# NOTE: this is the path based on running the script from the root dir
templateBody=$(<./src/utils/certificate-image-generator/certificate-image-generator.iac.json)

# create the stack w/the params
aws cloudformation create-stack --stack-name $stackName --template-body "$templateBody" --parameters ParameterKey=TCAGenerateCertificateQueueName,ParameterValue=$queueName
