const tokenRefresher = require('../sfdc_token_refresher');

(async () => {
    const token = await tokenRefresher.getSFDCAccessToken();
    console.log('SFDC token:', token);
})();