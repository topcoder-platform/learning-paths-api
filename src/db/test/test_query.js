
const db = require('../models');

(async () => {
    const results = await db.CertificationEnrollment.findAll();
    console.log(JSON.stringify(results, null, 2));
})();