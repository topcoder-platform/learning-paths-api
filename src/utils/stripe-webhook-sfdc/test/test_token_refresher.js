const tokenRefresher = require('../src/sfdc_token_refresher');

(async () => {
    await tokenRefresher.handle({});
})();