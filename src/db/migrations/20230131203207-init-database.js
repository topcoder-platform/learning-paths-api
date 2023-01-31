'use strict';

const fs = require('fs');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const schemaSQL = fs.readFileSync(path.resolve(__dirname, './init-database.sql'), 'utf8');
    console.log('Starting init-database UP migration...');

    await queryInterface.sequelize.query(schemaSQL);
  },

  async down(queryInterface) {
    console.log('Starting init-database DOWN migration...');
    await queryInterface.dropAllSchemas();
  }
};
