module.exports = {
  development: {
    username: process.env.CERT_PG_USER,
    password: process.env.CERT_PG_PASSWORD,
    database: process.env.CERT_PG_DATABASE,
    host: process.env.CERT_PG_HOST,
    dialect: 'postgres',
    pool: {
      max: 2,
      min: 0,
      idle: 0,
      acquire: 3000,
      evict: 5000
    }
  },
  // test: {
  //   username: process.env.CI_DB_USERNAME,
  //   password: process.env.CI_DB_PASSWORD,
  //   database: process.env.CI_DB_NAME,
  //   host: '127.0.0.1',
  //   dialect: 'postgres',
  // },
  production: {
    username: process.env.CERT_PG_USER,
    password: process.env.CERT_PG_PASSWORD,
    database: process.env.CERT_PG_DATABASE,
    host: process.env.CERT_PG_HOST,
    dialect: 'postgres',
  }
}