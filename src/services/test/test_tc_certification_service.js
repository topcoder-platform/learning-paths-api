const service = require('../TopcoderCertificationService');

(async () => {
    const { count, rows } = await service.getCertifications()
    console.log('certifications', rows[1].certificationResources)
})();