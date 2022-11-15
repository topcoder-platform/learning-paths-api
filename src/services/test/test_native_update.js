const { addCompletedLessonToModule } = require('../CertificationProgressService');


(async () => {
    const userId = '88778750';
    // const certProgressId = 'f7ab28ae-beb0-4084-8a4d-b21a8cdb5323';
    const certProgressId = '39f2988a-8b4d-4a11-a860-1852bfd10abe';

    const query = {
        module: 'learn-html-by-building-a-cat-photo-app',
        lesson: 'step-24',
        uuid: '5dfb6a35eacea3f48c6300b4'
    }
    const result = await addCompletedLessonToModule(certProgressId, userId, query)
    console.log(result);
})();