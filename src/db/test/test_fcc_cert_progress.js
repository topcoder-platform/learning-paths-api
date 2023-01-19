
const db = require('../models');

(async () => {
    const userId = Math.floor(Math.random() * 10000000); // '88778750';
    const options = {
        where: {
            certification: 'responsive-web-design'
        },
    }
    const cert = await db.FreeCodeCampCertification.findOne(options);
    const certProgress = await db.FccCertificationProgress.buildFromCertification(userId, cert);

    console.log('progress', certProgress)
})();