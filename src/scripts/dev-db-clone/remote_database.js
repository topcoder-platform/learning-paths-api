module.exports = {
  username: process.env.TCA_PG_USER_REMOTE,
  password: process.env.TCA_PG_PASSWORD_REMOTE,
  database: process.env.TCA_PG_DATABASE_REMOTE,
  host: process.env.TCA_PG_HOST_REMOTE,
  dialect: 'postgres',
  logging: false,
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
}