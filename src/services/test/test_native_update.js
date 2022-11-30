const { setLessonComplete } = require('../CertificationProgressService');


(async () => {
    const userId = '88778750';
    // const certProgressId = 'f7ab28ae-beb0-4084-8a4d-b21a8cdb5323'; // Chris local
    const certProgressId = '39f2988a-8b4d-4a11-a860-1852bfd10abe'; // in AWS dev

    const module = 'learn-html-by-building-a-cat-photo-app';
    const lesson = 'step-27';
    const lessonId = '5ef9b03c81a63668521804d2';

    const result = await setLessonComplete(userId, certProgressId, module, lesson, lessonId)
    console.log(result);
})();