const db = require('../../db/models');
const service = require('../CertificationEnrollmentService');

(async () => {
    const userId = '88778750';
    const certificationId = 14;

    const result = await service.createCertificationEnrollment(userId, certificationId);
    console.log(result)
})();