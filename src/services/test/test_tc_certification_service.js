const service = require('../TopcoderCertificationService');

(async () => {
    // const { count, rows } = await service.searchCertifications()
    // console.log('certifications', rows[1].certificationResources)

    const webDevCertId = 10;
    const cert = await service.getCertification(webDevCertId)
    console.log('certification', cert);
})();