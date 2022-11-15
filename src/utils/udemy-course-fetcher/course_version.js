const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient()

/**
 * This class is used to set a timestamped version number on the 
 * Udemy Course data when it is loaded. This allows us to load an 
 * entirely new collection of course data alongside the current 
 * version of it, then switch the "current" version over to the 
 * new one. This minimizes the period of time in which no data is 
 * available, and allows us to flush all the old data easily.
 */
class CourseVersion {
    version = null;

    constructor() {
        this.version = new Date(Date.now());
    }

    /**
     * Gets the current version
     * 
     * @returns the current CourseVersion object (the latest)
     */
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

    /**
     * Gets the new version string 
     * 
     * @returns the version string
     */
    newVersion() {
        return this.version;
    }

    /**
     * Replaces the current version with a new one
     * 
     * @returns the new (latest) version object
     */
    async updateVersion() {
        const latestVersion = await this.createNewVersion();
        await this.removePreviousVersions(latestVersion)

        return latestVersion;
    }

    /**
     * Creates a new version 
     * 
     * @returns the new version object
     */
    async createNewVersion() {
        const courseVersion = await prisma.dataVersion.create({
            data: {
                version: this.newVersion()
            },
        })

        return courseVersion;
    }

    /**
     * Removes any version objects older than the given one
     * 
     * @param {Object} beforeVersion the version below which all other versions will be deleted
     * @returns the count of deleted versions
     */
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
