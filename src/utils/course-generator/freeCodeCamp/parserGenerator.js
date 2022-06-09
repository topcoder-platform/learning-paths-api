'use strict';

/**
 * freeCodeCamp curriculum parser/generator. 
 * 
 * Used by the build-courses CLI to build freeCodeCamp course metadata
 * for use with Topcoder Academy's implementation of freeCodeCamp 
 * courses.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

class FreeCodeCampGenerator {
    PROVIDER = 'freeCodeCamp';
    SOURCE_FILES_DIR = 'source-files';

    ACTIVE_CERT_STATE = 'active';
    CERTIFICATIONS_FILE = 'certifications.json';
    CURRICULUM_FILE = 'curriculum.json';
    INTRO_FILE = 'intro.json';
    GENERATED_COURSES_FILE = 'generated_courses.json';

    generateCourseData() {
        console.log(`Generating learning path course data for provider ${this.PROVIDER}...`);

        const certifications = this.loadAndIdentifyActiveCertifications();
        const curriculumData = this.loadCurriculumData();

        const rawCourses = this.loadRawCourses(certifications, curriculumData);
        this.buildCourses(rawCourses);
    }

    loadAndIdentifyActiveCertifications() {
        const certPath = path.join(__dirname, this.SOURCE_FILES_DIR, this.CERTIFICATIONS_FILE);
        const certifications = JSON.parse(fs.readFileSync(certPath));

        let dirty = false;

        // check to be sure each certification has a UUID and
        // set it if not.
        certifications.forEach(cert => {
            if (!uuidValidate(cert.id)) {
                cert.id = uuidv4();
                dirty = true;
            }
        })

        if (dirty) {
            // if the certifications were updated, write the data back to JSON
            fs.writeFileSync(certPath, JSON.stringify(certifications, null, 2));
        }

        const activeCerts = certifications.filter(cert => cert.state == this.ACTIVE_CERT_STATE);
        this.displayActiveCerts(activeCerts);

        return activeCerts;
    }

    // Displays to the console the certifications and courses that will be generated
    displayActiveCerts(activeCerts) {
        const certCount = activeCerts.length;
        const certs = certCount == 1 ? 'certification' : 'certifications'

        console.log(`** Found ${certCount} active ${certs} with courses:`);

        activeCerts.forEach(cert => {
            console.log(`  - ${cert.title}`);
            console.log(`    -> Courses:`);
            cert.courses.forEach(course => {
                console.log(`      - ${course}`)
            })
            console.log("");
        })
    }

    // Loads the curriculum and introductory description data 
    loadCurriculumData() {
        const curriculumPath = path.join(__dirname, this.SOURCE_FILES_DIR, this.CURRICULUM_FILE);
        let rawCurriculum = fs.readFileSync(curriculumPath);
        const curriculum = JSON.parse(rawCurriculum);

        const introPath = path.join(__dirname, this.SOURCE_FILES_DIR, this.INTRO_FILE);
        let rawIntro = fs.readFileSync(introPath);
        const intro = JSON.parse(rawIntro);

        return { curriculum, intro }
    }

    loadRawCourses(certifications, curriculumData) {
        const { curriculum, intro } = curriculumData;

        let rawCourses = [];
        certifications.forEach(certification => {
            certification.courses.forEach(course => {
                const courseIntro = intro[course];

                const rawCourse = {
                    id: uuidv4(),
                    provider: this.PROVIDER,
                    key: course,
                    title: courseIntro.title,
                    certification: certification.certification,
                    completionHours: certification.completionHours,
                    introCopy: courseIntro.intro,
                    note: courseIntro.note,
                    modules: [],
                    blocks: curriculum[course].blocks,
                    blockIntros: courseIntro.blocks
                }
                rawCourses.push(rawCourse);
            });
        });

        return rawCourses;
    }

    parseModuleMeta(meta, blockIntro) {
        return {
            name: meta.name,
            dashedName: meta.dashedName,
            order: meta.order,
            estimatedCompletionTime: this.parseCompletionTime(meta.time),
            introCopy: blockIntro,
            lessonCount: meta.challengeOrder.length
        }
    }

    parseCompletionTime(completionTime) {
        const timeParts = completionTime.split(' ');
        return {
            value: timeParts[0],
            units: timeParts[1]
        }
    }

    parseChallenges(challenges) {
        const parsedChallenges = challenges.map(challenge => {
            return this.parseChallenge(challenge)
        })

        return parsedChallenges.sort(this.compareChallenges)
    }

    parseChallenge(challenge) {
        return {
            id: challenge.id,
            title: challenge.title,
            dashedName: challenge.dashedName,
            order: challenge.challengeOrder
        }
    }

    buildCourses(rawCourses) {
        rawCourses.forEach(course => {
            course.modules = [];

            const blockIntros = course.blockIntros;

            for (const [key, block] of Object.entries(course.blocks)) {
                const meta = block.meta;

                const module = {
                    key: meta.dashedName || key,
                    meta: this.parseModuleMeta(meta, blockIntros[key].intro),
                    lessons: this.parseChallenges(block.challenges)
                }
                course.modules.push(module);
            }

            // sort the modules in the order they should be shown
            course.modules.sort(this.compareModules);

            // remove the raw curriculum data that's no longer needed
            delete course.blocks;
            delete course.blockIntros;
        })

        // Write out the courses to JSON
        const coursesFilePath = path.join(__dirname, this.GENERATED_COURSES_FILE);
        fs.writeFileSync(coursesFilePath, JSON.stringify(rawCourses, null, 2));

        console.log(`** Courses for ${this.PROVIDER} have been written to ${coursesFilePath.toString()}`)
    }

    compareChallenges(a, b) {
        const a_value = a.order
        const b_value = b.order;

        if (a_value < b_value) {
            return -1;
        }
        if (a_value > b_value) {
            return 1;
        }
        return 0;
    }

    compareModules(a, b) {
        const a_value = a.meta.order;
        const b_value = b.meta.order;

        if (a_value < b_value) {
            return -1;
        }
        if (a_value > b_value) {
            return 1;
        }
        return 0;
    }
}

module.exports = FreeCodeCampGenerator;