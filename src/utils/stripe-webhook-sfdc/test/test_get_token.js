const sfdcHandler = require('../src/sfdc_handler');

(async () => {
    const data = await sfdcHandler.getSFDCAccessToken();
    console.log(data);
})();