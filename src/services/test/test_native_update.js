const { addCompletedLessonToModule } = require('../CertificationProgressService');

(async () => {
    const userId = 88778750;
    const certProgressId = 'f7ab28ae-beb0-4084-8a4d-b21a8cdb5323';
    const result = await addCompletedLessonToModule(userId, certProgressId, {})
    console.log(result);
})();