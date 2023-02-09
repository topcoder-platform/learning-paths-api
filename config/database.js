module.exports = {
  development: {
    username: process.env.TCA_PG_USER,
    password: process.env.TCA_PG_PASSWORD,
    database: process.env.TCA_PG_DATABASE,
    host: process.env.TCA_PG_HOST,
    dialect: 'postgres',
    // logging: false,
    pool: {
      max: 2,
      min: 0,
      idle: 0,
      acquire: 3000,
      evict: 5000
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
    host: process.env.TCA_PG_HOST,
    dialect: 'postgres',
    logging: false,
    define: {
      freezeTableName: true
    },
    minifyAliases: true,
  }
}