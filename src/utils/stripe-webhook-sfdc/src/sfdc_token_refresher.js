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

const JWT_PRIVATE_KEY_SECRET_NAME = process.env.JWT_PRIVATE_KEY_SECRET_NAME;
const JWT_TOKEN_ISSUER = process.env.JWT_TOKEN_ISSUER;
const JWT_TOKEN_SUBJECT = process.env.JWT_TOKEN_SUBJECT || 'vasavi.kuchimanchi@topcoder.com.opty';
const JWT_TOKEN_AUDIENCE = process.env.JWT_TOKEN_AUDIENCE || 'test.salesforce.com';

const OAUTH_TOKEN_URL = process.env.OAUTH_TOKEN_URL;
const SFDC_TOKEN_DURATION = process.env.SFDC_TOKEN_DURATION || 30; // days
const SFDC_TOKEN_EXPIRY_NOTIFICATION_VALUE = process.env.SFDC_TOKEN_EXPIRY_NOTIFICATION_VALUE || 2;
const SFDC_TOKEN_EXPIRY_NOTIFICATION_UNITS = process.env.SFDC_TOKEN_EXPIRY_NOTIFICATION_UNITS || 'days'; // days or hours

async function handle(event) {
    console.log('SFDC handler', event);

    let sfdcToken;
    const tokenExpiry = computeTokenExpiry();

    try {
        sfdcToken = await getSFDCAccessToken(tokenExpiry);
        // console.log('SFDC token:', sfdcToken);
        await storeToken(sfdcToken, tokenExpiry);
    } catch (error) {
        console.error('Error refreshing SFDC token:', error);
        throw error;
    }

    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: "SFDC handler",
                input: event,
            },
            null,
            2
        ),
    };
}

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

function computeTokenExpiry() {
    const tokenDuration = SFDC_TOKEN_DURATION * 24 * 60 * 60 * 1000; // days to milliseconds
    const expiry = new Date().getTime() + tokenDuration;

    return expiry;
}

async function getPrivateKey() {
    if (RUNNING_IN_AWS) {
        return await getPrivateKeyFromAWS();
    } else {
        return fs.readFileSync(path.join(__dirname, 'privatekey.pem'));
    }
}

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

async function storeToken(sfdcToken, expiry) {
    const expiryTimestamp = new Date(expiry).toISOString();
    console.log(
        `Storing SFDC access token that expires at ${expiryTimestamp} `,
        `with notification ${SFDC_TOKEN_EXPIRY_NOTIFICATION_VALUE} ${SFDC_TOKEN_EXPIRY_NOTIFICATION_UNITS} before`);

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