const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

module.exports = function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is required')
    const schema = new URL(connectionString).searchParams.get('schema') || undefined
    const adapter = new PrismaPg({ connectionString }, { schema })
    return new PrismaClient({ adapter })
}
