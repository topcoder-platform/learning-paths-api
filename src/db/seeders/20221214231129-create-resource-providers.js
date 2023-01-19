'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ResourceProvider', [
      {
        name: 'freeCodeCamp',
        description: 'Free courses about programming and some such',
        url: 'freeCodeCamp.org',
        attributionStatement: "This material was created by the <a href='https://www.freecodecamp.org'>freeCodeCamp.org community</a>.",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Udemy',
        description: 'Offering over 17,000 courses',
        url: 'udemy.com',
        attributionStatement: "Copyright 2022 - Udemy.com",
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ResourceProvider', null, {});
  }
};
