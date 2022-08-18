#!/bin/bash

# get the env
env=$1
if [ -z $env ]
  then
    echo "Enter env name:"
    read ENV
    env=$ENV
fi
envMessage="Environment:"

# get the stack and queue names
stackName="TCA-Certificate-Generator"
queueName="tca-certficate-generator"
if [ -z $env ]
  then
    echo "$envMessage No Env"
  else
    echo "$envMessage $env"
    stackName="$stackName-$env"
    queueName="$queueName-$env"
fi
echo "Stack name: $stackName"
echo "Queue name: $queueName"

# read in the template body
# NOTE: this is the path based on running the script from the root dir
templateBody=$(<./src/utils/certificate-image-generator/certificate-image-generator.yml)

# create the stack w/the params
aws cloudformation create-stack --stack-name $stackName --template-body "$templateBody" --parameters ParameterKey=TCAGenerateCertificateQueueName,ParameterValue=$queueName
