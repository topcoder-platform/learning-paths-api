
const db = require('../models');

(async () => {
    // const results = await db.CertificationEnrollment.findAll();
    // console.log(JSON.stringify(results, null, 2));
    const certificationId = 14;
    const userId = '88778750';

    const certification = await db.TopcoderCertification.findByPk(certificationId, {
        include: {
            model: db.CertificationResource,
            as: 'certificationResources',
            include: {
                model: db.FreeCodeCampCertification,
                as: 'freeCodeCampCertification',
                include: {
                    model: db.FccCertificationProgress,
                    as: 'certificationProgresses',
                    where: {
                        userId: userId
                    }
                }
            }
        }
    })

    for (const resource of certification.certificationResources) {
        const fccCert = resource.freeCodeCampCertification
        const progress = fccCert?.certificationProgresses ? fccCert.certificationProgresses[0] : null

        console.log(progress.constructor.name)
    }
})();