'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const webCategory = await queryInterface.sequelize.query(
      `SELECT id from "CertificationCategory" where category = 'Web Development';`
    );
    const webId = webCategory[0][0].id;

    const dataSciCategory = await queryInterface.sequelize.query(
      `SELECT id from "CertificationCategory" where category = 'Data Science';`
    );
    const dataSciId = dataSciCategory[0][0].id;

    const createDate = new Date();

    await queryInterface.bulkInsert('TopcoderCertification', [
      {
        title: 'Web Development Fundamentals',
        dashedName: 'web-development-fundamentals',
        description: 'Covers all the basics of front-end and back-end web development',
        status: 'active',
        certificationCategoryId: webId,
        learnerLevel: 'Beginner',
        version: createDate,
        skills: ['HTML', 'CSS', 'accessibility', 'Bootstrap', 'JavaScript', 'Sass', 'Single Page Applications', 'React', 'redux', 'Node.js', 'npm', 'Express', 'MongoDB', 'API', 'Web Development'],
        learningOutcomes: [
          'Build a cat photo app to learn the basics of HTML and CSS.',
          'Learn modern techniques like CSS variables and learn best practices for accessibility.',
          'Make web pages that respond to different screen sizes with Flexbox and CSS Grid.',
          'Learn how to style your site quickly with Bootstrap. Learn how to add logic to your CSS styles and extend them with Sass.',
          'Build a shopping cart and other applications to learn how to create powerful Single Page Applications (SPAs) with React and Redux.',
          'Create algorithms to manipulate strings, factorialize numbers, and even calculate the orbit of the International Space Station.',
          'Learn two important programming styles or paradigms: Object Oriented Programming (OOP) and Functional Programming (FP)',
          'Learn how to write back end apps with Node.js and npm (Node Package Manager). Build web applications with the Express framework, and build a People Finder microservice with MongoDB'
        ],
        learnedOutcomes: [
          'The basics of HTML and CSS by building a web application',
          'Modern techniques like CSS variables and best practices for accessibility',
          'How to build web pages that respond to different screen sizes with Flexbox and CSS Grid',
          'Styling quickly with Bootstrap and adding logic to CSS styles and extending them with Sass',
          'Building a shopping cart and other applications to create powerful Single Page Applications (SPAs) with React and Redux',
          'Algorithms to manipulate strings, factorialize numbers, and even calculate the orbit of the International Space Station',
          'Two important programming paradigms: Object Oriented Programming (OOP) and Functional Programming (FP)',
          'Writing back-end apps with Node.js and npm (Node Package Manager)',
          'Web APIs with the Express framework, and a People Finder microservice with MongoDB'
        ],
        prerequisites: ['There are no prerequisites for this certification.'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Data Science Fundamentals',
        dashedName: 'data-science-fundamentals',
        description: 'Learn the basics of data science along with practical applications',
        status: 'active',
        certificationCategoryId: dataSciId,
        learnerLevel: 'Beginner',
        version: createDate,
        skills: ['Python', 'data structures', 'data visualization', 'data analysis', 'Numpy', 'Pandas', 'Matplot', 'D3.js', 'TensorFlow', 'neural networks', 'NLP', 'AI', 'Machine Learning'],
        learningOutcomes: [
          'Learn Python fundamentals like variables, loops, conditionals, and functions. Then quickly ramp up to complex data structures, networking, relational databases, and data visualization.',
          'Learn the fundamentals of data analysis with Python.',
          'Read data from sources like CSVs and SQLLearn to use libraries like Numpy, Pandas, Matplot',
          'Build charts, graphs, and maps to present different types of data with the D3.js library.',
          'Learn about JSON (JavaScript Object Notation), and how to work with data online using an API (Application Programming Interface)',
          'Learn the TensorFlow framework to build several neural networks and explore more advanced techniques like natural language processing and reinforcement learning',
          'Dive into neural networks, and learn the principles behind how deep, recurrent, and convolutional neural networks work'
        ],
        // TODO: add when privided by Glenn
        learnedOutcomes: [],
        prerequisites: ['There are no prerequisites for this certification.'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TopcoderCertification', null, {});
  }
};
