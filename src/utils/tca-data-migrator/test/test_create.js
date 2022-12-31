const db = require('../../../db/models');

const course = {
    id: '6f0a610e-79e6-406e-87b7-21996aa3ed2f',
    key: 'javascript-algorithms-and-data-structures',
    title: 'JavaScript Algorithms and Data Structures',
    certificationId: 25,
    modules: [
        {
            key: 'basic-javascript',
            name: 'Basic JavaScript',
            dashedName: 'basic-javascript',
            estimatedCompletionTimeValue: 10,
            estimatedCompletionTimeUnits: 'hours',
            introCopy: [
                'JavaScript is a scripting language you can use to make web pages interactive. It is one of the core technologies of the web, along with HTML and CSS, and is supported by all modern browsers.',
                "In this course, you'll learn fundamental programming concepts in JavaScript. You'll start with basic data structures like numbers and strings. Then you'll learn to work with arrays, objects, functions, loops, if/else statements, and more."
            ],
            isAssessment: false,
            lessons: [
                {
                    id: "bd7123c9c441eddfaeb4bdef",
                    title: 'Comment Your JavaScript Code',
                    dashedName: 'comment-your-javascript-code',
                    isAssessment: false,
                    order: 0
                },
                {
                    id: "bd7123c9c443eddfaeb5bdef",
                    title: 'Declare JavaScript Variables',
                    dashedName: 'declare-javascript-variables',
                    isAssessment: false,
                    order: 1
                },
            ],
        }
    ]
};

const courses = [course];

(async () => {

    await db.FccCourse.bulkCreate(courses, {
        include: [{
            model: db.FccModule,
            as: 'modules',
            include: [{
                model: db.FccLesson,
                as: 'lessons'
            }]
        }]
    });
})();

