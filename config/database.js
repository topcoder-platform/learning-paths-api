module.exports = {
  development: {
    username: process.env.TCA_PG_USER,
    password: process.env.TCA_PG_PASSWORD,
    database: process.env.TCA_PG_DATABASE,
    schema: process.env.TCA_PG_SCHEMA,
    host: process.env.TCA_PG_HOST,
    dialectOptions: {
      prependSearchPath: true
    },
    searchPath: process.env.TCA_PG_SCHEMA,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
      acquire: 5000,
      evict: 1000
    },
    define: {
      freezeTableName: true
    },
    minifyAliases: true,
  },
  // test: {
  //   username: process.env.CI_DB_USERNAME,
  //   password: process.env.CI_DB_PASSWORD,
  //   database: process.env.CI_DB_NAME,
  //   host: '127.0.0.1',
  //   dialect: 'postgres',
  // },
  production: {
    username: process.env.TCA_PG_USER,
    password: process.env.TCA_PG_PASSWORD,
    database: process.env.TCA_PG_DATABASE,
    schema: process.env.TCA_PG_SCHEMA,
    host: process.env.TCA_PG_HOST,
    dialectOptions: {
      prependSearchPath: true
    },
    searchPath: process.env.TCA_PG_SCHEMA,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 100,
      min: 0,
      idle: 10000,
      acquire: 5000,
      evict: 1000
    },
    define: {
      freezeTableName: true
    },
    minifyAliases: true,
  }
}