const service = require('../CertificationResourceService');

(async () => {
    const query = { topcoderCertificationId: 10 }
    const result = await service.getResourcesForCertification(query)
    console.log('result', JSON.stringify(result[0], null, 2))
    console.log('resource', result[1].resource)
})();