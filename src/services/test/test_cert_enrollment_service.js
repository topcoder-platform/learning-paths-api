const db = require('../../db/models');
const service = require('../CertificationEnrollmentService');

(async () => {
    const userId = '88778750';
    const certificationId = 14;

    const enrollment = await service.enrollUser(userId, certificationId);
    console.log('enrollment', enrollment);
})();