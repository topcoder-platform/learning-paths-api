const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient()

class CourseVersion {
    version = null;

    constructor() {
        this.version = new Date(Date.now());
    }

    async currentVersion() {
        const current = await prisma.dataVersion.findFirst({
            orderBy: [
                {
                    version: 'desc'
                }
            ],
            take: 1
        });

        return current;
    }

    newVersion() {
        return this.version;
    }

    async updateVersion() {
        const latestVersion = await this.createNewVersion();
        await this.removePreviousVersions(latestVersion)

        return latestVersion;
    }

    async createNewVersion() {
        const courseVersion = await prisma.dataVersion.create({
            data: {
                version: this.newVersion()
            },
        })

        return courseVersion;
    }

    async removePreviousVersions(beforeVersion) {
        const deletedVersions = await prisma.dataVersion.deleteMany({
            where: {
                version: {
                    lt: beforeVersion.version
                }
            }
        })

        return deletedVersions;
    }
}

module.exports = CourseVersion
