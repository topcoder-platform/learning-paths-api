const db = require('../../db/models');
const service = require('../CertificationEnrollmentService');

(async () => {
    const certificationId = 14;
    const userId = '88778750';

    let options = {
        where: {
            topcoderCertificationId: certificationId,
            userId: userId
        },
        include: {
            model: db.TopcoderCertification,
            as: 'topcoderCertification'
        }
    }

    let result = await service.getEnrollment(options)
    console.log('certification enrollment', result)
    console.log('certification', result.topcoderCertification);

    result = await service.getEnrollmentById(result.id);
    console.log('enrollment', result);

    // const enrollment = await service.createCertificationEnrollment(certificationId, userId);
    // console.log('new enrollment', enrollment);

    // result = await service.getEnrollment(options)
    // console.log('enrollment after create', result)
})();