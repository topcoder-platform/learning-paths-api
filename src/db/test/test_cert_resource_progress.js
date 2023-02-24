
const db = require('../models');

(async () => {
    const certResProgress = await db.CertificationResourceProgress.findOne();
    console.log(certResProgress);

    const resProg = await certResProgress.getProgressable();
    console.log(resProg);
})();