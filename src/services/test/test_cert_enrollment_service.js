const db = require('../../db/models');
const service = require('../CertificationEnrollmentService');

(async () => {
    const userId = '88778750';
    const certificationId = 14;

    // const unenrollResult = await service.unenrollUser(userId, certificationId);
    // console.log('unenrollResult', unenrollResult);

    const enrollment = await service.createCertificationEnrollment(userId, certificationId);
    console.log(enrollment)

})();