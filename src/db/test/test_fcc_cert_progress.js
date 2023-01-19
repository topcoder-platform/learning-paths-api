
const db = require('../models');

(async () => {
    const userId = '44224422'; // '88778750';
    const options = {
        where: {
            certification: 'responsive-web-design'
        },
    }
    const cert = await db.FreeCodeCampCertification.findOne(options);

    const certProgress = db.FccCertificationProgress.buildFromCertification(userId, cert);

    // console.log('progress', certProgress)
})();