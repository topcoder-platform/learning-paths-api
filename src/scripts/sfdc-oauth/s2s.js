// This script creates JWT and then exchanges it for access token
// which can be used for calling the SFDC APIs.
//
// OAuth 2.0 JWT Bearer Flow for Server-to-Server Integration
// https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_jwt_flow.htm&type=5

const jwt = require('jsonwebtoken');
const fs = require('fs');
const axios = require('axios');
const url = require('url');

const privateKey = fs.readFileSync('./privatekey.pem');
const payload = {
    iss: process.env.JWT_ISS_TOKEN,
    sub: "vasavi.kuchimanchi@topcoder.com.opty",
    aud: "test.salesforce.com",
    exp: new Date().getTime() + 2629800000 // 1 month exp time
};
const oauthTokenAPI = process.env.OAUTH_TOKEN_API || 'https://test.salesforce.com/services/oauth2/token';

// execute
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

console.log('JWT created with payload:', payload, 'JWT dump:', token);
console.log(`Trying to exchange JWT for access token via ${oauthTokenAPI} ...`);

const params = new url.URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: token
});

axios.post(oauthTokenAPI, params.toString())
    .then(rsp => console.log('SFDC Token API Response:', rsp.data))
    .catch(e => console.error('Error calling SFDC token API:', e.message, e.response.status, e.response.data));
