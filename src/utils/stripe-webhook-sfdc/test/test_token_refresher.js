const tokenRefresher = require('../sfdc_token_refresher');

(async () => {
    await tokenRefresher.handle({});
})();