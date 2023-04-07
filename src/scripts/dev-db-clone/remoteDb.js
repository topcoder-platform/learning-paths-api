const modelsDir = '../../db/models';
const config = require(__dirname + '/remote_database.js');
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const indexFile = 'index.js';
const remoteDb = {};
const sequelize = new Sequelize(config.database, config.username, config.password, config);

const modelsPath = path.join(__dirname, modelsDir);

fs
    .readdirSync(modelsPath)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== indexFile) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
        remoteDb[model.name] = model;
    });

Object.keys(remoteDb).forEach(modelName => {
    if (remoteDb[modelName].associate) {
        remoteDb[modelName].associate(remoteDb);
    }
});

remoteDb.sequelize = sequelize;
remoteDb.Sequelize = Sequelize;

module.exports = remoteDb;