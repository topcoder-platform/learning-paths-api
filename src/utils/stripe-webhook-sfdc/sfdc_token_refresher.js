const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const url = require('url');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const JWT_PRIVATE_KEY_SECRET_NAME = process.env.JWT_PRIVATE_KEY_SECRET_NAME;
const JWT_TOKEN_ISSUER = process.env.JWT_TOKEN_ISSUER;
const JWT_TOKEN_SUBJECT = process.env.JWT_TOKEN_SUBJECT || 'vasavi.kuchimanchi@topcoder.com.opty';
const JWT_TOKEN_AUDIENCE = process.env.JWT_TOKEN_AUDIENCE || 'test.salesforce.com';

const OAUTH_TOKEN_URL = process.env.OAUTH_TOKEN_URL;
const SFDC_TOKEN_EXPIRY = process.env.SFDC_TOKEN_EXPIRY || 30; // 30 days

const RUNNING_IN_AWS = !!process.env.LAMBDA_TASK_ROOT;

async function handle(event) {
    console.log('SFDC handler', event);

    let sfdcToken;

    try {
        sfdcToken = await getSFDCAccessToken();
        console.log('SFDC token:', sfdcToken);
    } catch (error) {
        console.error('Error getting SFDC token:', error);
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

async function getSFDCAccessToken() {
    const webToken = await getJWT();

    const params = new url.URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: webToken
    });

    let sfdcToken;

    try {
        const response = await axios.post(OAUTH_TOKEN_URL, params.toString())
        sfdcToken = response.data;
    } catch (error) {
        console.error(error.message, error.response.status, error.response.data);
        throw error;
    }

    return sfdcToken;
}

async function getJWT() {
    const privateKey = await getPrivateKey();
    const expiry = SFDC_TOKEN_EXPIRY * 24 * 60 * 60 * 1000;

    const payload = {
        iss: JWT_TOKEN_ISSUER,
        sub: JWT_TOKEN_SUBJECT,
        aud: JWT_TOKEN_AUDIENCE,
        exp: new Date().getTime() + expiry
    };

    const webToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    // console.log('JWT created with payload:', payload, 'JWT dump:', webToken);

    return webToken;
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

module.exports = {
    getSFDCAccessToken,
    handle,
}