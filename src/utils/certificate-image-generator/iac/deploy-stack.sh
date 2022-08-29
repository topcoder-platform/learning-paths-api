#!/bin/bash

# get the env
env=$1
if [ -z $env ]
    then
        echo "Enter env name:"
        read ENV
        env=$ENV
fi
envMessage=Environment:

# get the stack and queue names
stackName=TCA-Certificate-Generator
queueName=tca-certificate-generator-sqs
if [ -z $env ]
    then
        echo "$envMessage No Env"
    else
        echo "$envMessage $env"
        stackName=$stackName-$env
        queueName=$queueName-$env
fi
echo "Stack name: $stackName"
echo "Queue name: $queueName"

# create the stack w/the params
aws cloudformation deploy \
    --stack-name $stackName \
    --template-file certificate-image-generator.yml \
    --parameter-overrides \
        TCAGenerateCertificateQueueName=$queueName
