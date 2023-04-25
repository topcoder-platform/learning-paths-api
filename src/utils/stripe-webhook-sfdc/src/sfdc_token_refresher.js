const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const url = require('url');
const {
    SecretsManagerClient,
    GetSecretValueCommand
} = require("@aws-sdk/client-secrets-manager");

const {
    SSMClient,
    PutParameterCommand
} = require("@aws-sdk/client-ssm");

const {
    RUNNING_IN_AWS,
    SFDC_TOKEN_PARAM_NAME
} = require('./constants');

// Values used to generate the JWT token which is used to 
// retrieve the Salesforce access token
const JWT_PRIVATE_KEY_SECRET_NAME = process.env.JWT_PRIVATE_KEY_SECRET_NAME;
const JWT_TOKEN_ISSUER = process.env.JWT_TOKEN_ISSUER;
const JWT_TOKEN_SUBJECT = process.env.JWT_TOKEN_SUBJECT || 'vasavi.kuchimanchi@topcoder.com.opty';
const JWT_TOKEN_AUDIENCE = process.env.JWT_TOKEN_AUDIENCE || 'test.salesforce.com';

const OAUTH_TOKEN_URL = process.env.OAUTH_TOKEN_URL;
const SFDC_TOKEN_DURATION = process.env.SFDC_TOKEN_DURATION || 30; // days
const SFDC_TOKEN_EXPIRY_NOTIFICATION_VALUE = process.env.SFDC_TOKEN_EXPIRY_NOTIFICATION_VALUE || 2;
const SFDC_TOKEN_EXPIRY_NOTIFICATION_UNITS = process.env.SFDC_TOKEN_EXPIRY_NOTIFICATION_UNITS || 'days'; // days or hours

/**
 * The main entry point for the Lambda function that refreshes the SFDC 
 * token stored in Param Store.
 * 
 * @param {Object} event the EventBridge event that triggered this Lambda
 * @returns HTTP success code, or throws an error
 */
async function handle(event) {
    console.log('SFDC handler', event);

    let sfdcToken;
    const tokenExpiry = computeTokenExpiry();

    try {
        sfdcToken = await getSFDCAccessToken(tokenExpiry);
        await storeToken(sfdcToken, tokenExpiry);
    } catch (error) {
        console.error('Error refreshing SFDC token:', error);
        throw error;
    }

    return {
        statusCode: 200
    };
}

/**
 * Retrieves a new SFDC access token from an SFDC API endpoint.
 * 
 * @param {Integer} tokenExpiry the expiry time of the token, in seconds since the epoch
 * @returns the SFDC access token
 */
async function getSFDCAccessToken(tokenExpiry) {
    const webToken = await getJWT(tokenExpiry);

    const params = new url.URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: webToken
    });

    let sfdcToken;

    try {
        const response = await axios.post(OAUTH_TOKEN_URL, params.toString())
        sfdcToken = response.data.access_token;
    } catch (error) {
        console.error(error.message, error.response.status, error.response.data);
        throw error;
    }

    return sfdcToken;
}

/**
 * Generates a JSON Web Token (JWT) used to authenticate the call to retrieve the 
 * SFDC access token.
 * 
 * @param {Integer} tokenExpiry the expiry time of the token, in seconds since the epoch
 * @returns a JWT token
 */
async function getJWT(tokenExpiry) {
    const privateKey = await getPrivateKey();

    const payload = {
        iss: JWT_TOKEN_ISSUER,
        sub: JWT_TOKEN_SUBJECT,
        aud: JWT_TOKEN_AUDIENCE,
        exp: tokenExpiry
    };

    const webToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    // TODO: keep this for debugging
    // console.log('JWT created with payload:', payload, 'JWT dump:', webToken);

    return webToken;
}

/**
 * Computes the expiration time of the SFDC access token based on the current time.
 * The constant used to define the duration of the token is configured in the Lambda's
 * environment variables.
 * 
 * @returns the expiry time of the SFDC access token, in milliseconds since the epoch
 */
function computeTokenExpiry() {
    const tokenDuration = SFDC_TOKEN_DURATION * 24 * 60 * 60 * 1000; // days to milliseconds
    const expiry = new Date().getTime() + tokenDuration;

    return expiry;
}

/**
 * Retrieves the private key used to generate the JWT token, either from AWS Secrets Manager
 * or from a local file. Note: the local file, privatekey.pem, is not checked into source control.
 * 
 * @returns the private key 
 */
async function getPrivateKey() {
    if (RUNNING_IN_AWS) {
        return await getPrivateKeyFromAWS();
    } else {
        return fs.readFileSync(path.join(__dirname, '..', 'privatekey.pem'));
    }
}

// Retrieve the private key from AWS Secrets Manager
async function getPrivateKeyFromAWS() {
    const client = new SecretsManagerClient({
        region: "us-east-1",
    });

    let response, privateKey;

    try {
        response = await client.send(
            new GetSecretValueCommand({
                SecretId: JWT_PRIVATE_KEY_SECRET_NAME,
                VersionStage: "AWSCURRENT",
            })
        );

        privateKey = response.SecretString;
    } catch (error) {
        throw error;
    }

    return privateKey;
}

/**
 * Stores the SFDC access token in AWS Param Store, along with policies 
 * that expire the token and trigger notification prior to expiry.
 * 
 * Note: the 'Advanced' parameter tier is required to set the policies.
 * 
 * @param {String} sfdcToken the SFDC access token
 * @param {Integer} expiry the expiry time of the token, in milliseconds since the epoch
 */
async function storeToken(sfdcToken, expiry) {
    const value = SFDC_TOKEN_EXPIRY_NOTIFICATION_VALUE;
    const units = SFDC_TOKEN_EXPIRY_NOTIFICATION_UNITS;
    const expiryTimestamp = new Date(expiry).toISOString();

    console.log(
        `Storing SFDC access token that expires at ${expiryTimestamp} `,
        `with notification ${value} ${units} before`);

    const client = new SSMClient({
        region: "us-east-1",
    });

    const input = {
        Name: SFDC_TOKEN_PARAM_NAME,
        Value: sfdcToken,
        Type: "SecureString",
        Tier: "Advanced",
        Overwrite: true,
        Policies: paramStorePolicies(expiryTimestamp)
    };

    const command = new PutParameterCommand(input);
    const response = await client.send(command);

    console.log('Token stored response:', response['$metadata']['httpStatusCode']);
}

/**
 * The Param Store policies that set the expiration and notification of expiry of 
 * the SFDC access token.
 * 
 * @param {Integer} expiryTimestamp the expiry time of the token, in milliseconds since the epoch
 * @returns the JSON string representation of the policies to apply to the token parameter
 */
function paramStorePolicies(expiryTimestamp) {
    const paramPolicies = [
        {
            "Type": "Expiration",
            "Version": "1.0",
            "Attributes": {
                "Timestamp": expiryTimestamp
            }
        },
        {
            "Type": "ExpirationNotification",
            "Version": "1.0",
            "Attributes": {
                "Before": SFDC_TOKEN_EXPIRY_NOTIFICATION_VALUE,
                "Unit": SFDC_TOKEN_EXPIRY_NOTIFICATION_UNITS
            }
        }
    ];

    return JSON.stringify(paramPolicies);
}

module.exports = {
    getSFDCAccessToken,
    handle,
}