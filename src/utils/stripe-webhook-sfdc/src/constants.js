const SFDC_TOKEN_PARAM_NAME = process.env.SFDC_TOKEN_PARAM_NAME || '/stripe-webhook-sfdc/sfdc-token';

// This is a hack to determine if we're running in AWS Lambda vs locally
const RUNNING_IN_AWS = !!process.env.LAMBDA_TASK_ROOT;

module.exports = {
    RUNNING_IN_AWS,
    SFDC_TOKEN_PARAM_NAME
}