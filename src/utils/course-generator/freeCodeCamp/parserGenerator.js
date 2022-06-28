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
    ADDITIONAL_DATA_FILE = 'additional-data.json';
    GENERATED_COURSES_FILE = 'generated_courses.json';

    /**
     * Top level class method that the CLI module will call. This method does all 
     * of the work to generate the standard course data for this particular provider.
     * 
     * This method needs to be implemented for any other learning resource provider
     * whose content we will ingest.
     */
    generateCourseData() {
        console.log(`Generating learning path course data for provider ${this.PROVIDER}...`);

        const certifications = this.loadAndIdentifyActiveCertifications();
        const curriculumData = this.loadCurriculumData();
        const additionalData = this.loadAdditionalData();

        const rawCourses = this.buildRawCourses(certifications, curriculumData, additionalData);
        const courses = this.buildCourses(rawCourses);
        return this.writeCourseFile(courses);
    }

    /**
     * Loads active certifications for this provider. 
     * If a certification doesn't have a valid UUID ID one is added.
     * 
     * @returns active certifications with unique IDs
     */
    loadAndIdentifyActiveCertifications() {
        const certPath = path.join(__dirname, this.SOURCE_FILES_DIR, this.CERTIFICATIONS_FILE);
        const certifications = JSON.parse(fs.readFileSync(certPath));

        let dirty = false;

        // check to be sure each certification has a UUID and
        // set it if not.
        certifications.forEach(cert => {
            if (!cert.id || !uuidValidate(cert.id)) {
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

    /**
     * Displays to the console the certifications and courses that will be generated
     * 
     * @param {array of certifications} activeCerts 
     */
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

    /**
     * Loads the curriculum and introductory description data from 
     * their respective files
     * 
     * @returns curriculum and intro data
     */
    loadCurriculumData() {
        const curriculumPath = path.join(__dirname, this.SOURCE_FILES_DIR, this.CURRICULUM_FILE);
        let rawCurriculum = fs.readFileSync(curriculumPath);
        const curriculum = JSON.parse(rawCurriculum);

        const introPath = path.join(__dirname, this.SOURCE_FILES_DIR, this.INTRO_FILE);
        let rawIntro = fs.readFileSync(introPath);
        const intro = JSON.parse(rawIntro);

        return { curriculum, intro }
    }
    /**
     * Loads additional course data from a file. This data is then added to the 
     * applicable course when course data is generated.
     * 
     * @returns object of additional data to add to courses
     */
    loadAdditionalData() {
        const filePath = path.join(__dirname, this.SOURCE_FILES_DIR, this.ADDITIONAL_DATA_FILE);
        let rawAddlData = fs.readFileSync(filePath);
        return JSON.parse(rawAddlData);
    }

    /**
     * Builds raw course data from the certification, curriculum and intro data,
     * along with custom additional data. For each certification it builds the 
     * array of courses in a standardized format.
     * 
     * @param {array of certifications} certifications 
     * @param {curriculum and intro objects} curriculumData 
     * @param {custom additional data object} additionalData 
     * @returns 
     */
    buildRawCourses(certifications, curriculumData, additionalData) {
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
                    certificationId: certification.id,
                    certification: certification.certification,
                    completionHours: certification.completionHours,
                    introCopy: courseIntro.intro,
                    note: courseIntro.note,
                    modules: [],
                    blocks: curriculum[course].blocks,
                    blockIntros: courseIntro.blocks
                }
                this.decorateCourseWithAdditionalData(rawCourse, additionalData);

                rawCourses.push(rawCourse);
            });
        });

        return rawCourses;
    }

    /**
     * Adds additional custom data to each course based on data in the additional-data.json
     * file. This allows us to inject web copy or other data not supplied by the course 
     * provider.
     * 
     * @param {Course} course 
     * @param {Object} additionalData 
     * @returns course decorated with additional key/values
     */
    decorateCourseWithAdditionalData(course, additionalData) {
        const courseAddlData = additionalData['course']?.[course.key]
        if (!courseAddlData) { return };

        for (const [key, value] of Object.entries(courseAddlData)) {
            course[key] = value;
        }
    }

    /**
     * Constructs a standard course metadata object from the curriculum 
     * metadata and block intro data. 
     * 
     * @param {metadata object} meta 
     * @param {intro data object} blockIntro 
     * @returns course metadata object
     */
    parseModuleMeta(meta, blockIntro) {
        return {
            name: meta.name,
            dashedName: meta.dashedName,
            order: meta.order,
            estimatedCompletionTime: this.parseLessonCompletionTime(meta.time),
            introCopy: blockIntro,
            lessonCount: meta.challengeOrder.length
        }
    }

    /**
     * Creates an object describing the time requirements to complete 
     * a particular lesson.
     * 
     * @param {String} completionTime 
     * @returns object with time value and units
     */
    parseLessonCompletionTime(completionTime) {
        const timeParts = completionTime.split(' ');
        return {
            value: timeParts[0],
            units: timeParts[1]
        }
    }

    /**
     * Creates an array of challenge objects sorted in the order 
     * the challenges should be accomplished and displayed.
     * 
     * @param {array of challenges} challenges 
     * @returns sorted array of challenge objects
     */
    parseChallenges(challenges) {
        const parsedChallenges = challenges.map(challenge => {
            return this.parseChallenge(challenge)
        })

        return parsedChallenges.sort(this.compareChallenges)
    }

    /**
     * Creates a standard challenge (lesson) object from 
     * the raw curriculum challenge data
     * 
     * @param {raw challenge object} challenge 
     * @returns challenge object
     */
    parseChallenge(challenge) {
        return {
            id: challenge.id,
            title: challenge.title,
            dashedName: challenge.dashedName,
            order: challenge.challengeOrder
        }
    }

    /**
     * Builds the final standardized course data objects from the 
     * raw course data, including adding metadata, lessons and modules.
     * Removes raw course block and intro data that is not output.
     * 
     * @param {array of raw course data} rawCourses 
     * @returns formatted course data
     */
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

        return rawCourses;
    }

    /**
     * Writes the final course data to a JSON file.
     * 
     * @param {array of course data} courses 
     * @returns {Path} the complete file path to the generated course JSON file
     */
    writeCourseFile(courses) {
        const coursesFilePath = path.join(__dirname, this.GENERATED_COURSES_FILE);
        fs.writeFileSync(coursesFilePath, JSON.stringify(courses, null, 2));

        return coursesFilePath;
    }

    /**
     * Custom comparison function for challenge objects, 
     * which are sorted by their order value.
     * 
     * @param {*} a 
     * @param {*} b 
     * @returns sort value
     */
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

    /**
     * Custom comparison function for module objects, 
     * which are sorted by their order meta.order value.
     * 
     * @param {*} a 
     * @param {*} b 
     * @returns sort value
     */
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