
const { randomInt } = require('crypto');
const db = require('../models');

(async () => {
    // creating a bogus user ID for testing
    const userId = randomInt(10000000);
    const options = {
        where: {
            certification: 'responsive-web-design'
        },
    }
    const cert = await db.FreeCodeCampCertification.findOne(options);
    const certProgress = await db.FccCertificationProgress.buildFromCertification(userId, cert);

    console.log('progress', certProgress)
})();
