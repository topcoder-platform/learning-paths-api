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
    SOURCE_FILES_DIR = 'source-files';

    ACTIVE_CERT_STATE = 'active';
    CERTIFICATIONS_FILE = 'certifications.json';
    CURRICULUM_FILE = 'curriculum.json';
    INTRO_FILE = 'intro.json';
    ADDITIONAL_DATA_FILE = 'additional-data.json';
    GENERATED_COURSES_FILE = 'generated_courses.json';

    generatedCourseFilePath = null;
    certificationsFilePath = null;

    // taken straight from FCC's source code
    challengeTypes = {
        html: 0,
        js: 1,
        backend: 2,
        zipline: 3,
        frontEndProject: 3,
        backEndProject: 4,
        pythonProject: 10,
        jsProject: 5,
        modern: 6,
        step: 7,
        quiz: 8,
        invalid: 9,
        video: 11,
        codeAllyPractice: 12,
        codeAllyCert: 13,
        multifileCertProject: 14
    };

    constructor(provider) {
        this.provider = provider
        this.providerName = provider.name
    }

    /**
     * Top level class method that the CLI module will call. This method does all 
     * of the work to generate the standard course data for this particular provider.
     * 
     * This method needs to be implemented for any other learning resource provider
     * whose content we will ingest.
     */
    generateCourseData() {
        console.log(`Generating learning path course data for provider ${this.providerName}...`);

        const certifications = this.loadAndIdentifyActiveCertifications();
        const curriculumData = this.loadCurriculumData();
        const additionalData = this.loadAdditionalData();

        const rawCourses = this.buildRawCourses(certifications, curriculumData, additionalData);
        const courses = this.buildCourses(rawCourses);

        this.generatedCourseFilePath = this.writeCourseFile(courses);

        return this.generatedCourseFilePath;
    }

    /**
     * Loads active certifications for this provider. 
     * If a certification doesn't have a valid UUID ID one is added.
     * 
     * @returns active certifications with unique IDs
     */
    loadAndIdentifyActiveCertifications() {
        this.certificationsFilePath = path.join(__dirname, this.SOURCE_FILES_DIR, this.CERTIFICATIONS_FILE);
        const certificationsFile = fs.readFileSync(this.certificationsFilePath);
        const certifications = JSON.parse(certificationsFile);

        let dirty = false;

        // check to be sure each certification has a UUID and
        // set it if not.
        certifications.forEach(cert => {
            if (!cert.id || !uuidValidate(cert.id)) {
                cert.id = uuidv4();
                dirty = true;
            }
            if (!cert.providerId || !uuidValidate(cert.providerId)) {
                cert.providerId = this.provider.id;
                dirty = true;
            }
        })

        // if the certifications were updated, write the data back to the JSON file
        if (dirty) {
            fs.writeFileSync(this.certificationsFilePath, JSON.stringify(certifications, null, 2));
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
                    providerId: this.provider.id,
                    provider: this.providerName,
                    key: course,
                    title: courseIntro.title,
                    certificationId: certification.id,
                    certification: certification.certification,
                    completionHours: certification.completionHours,
                    introCopy: courseIntro.intro,
                    modules: [],
                    blocks: curriculum[course].blocks,
                    blockIntros: courseIntro.blocks
                }

                // Add the +note+ attribute if it's not an empty string
                // DynamoDB will not accept an empty string as the value for an 
                // attribute, even if that attr is not required.
                if (courseIntro.note && courseIntro.note.length > 0) {
                    rawCourse.note = courseIntro.note
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
    parseModuleMeta(key, meta, isAssessmentModule, blockIntro) {
        return {
            name: meta.name,
            dashedName: meta.dashedName || key,
            order: meta.order,
            estimatedCompletionTime: this.parseLessonCompletionTime(meta),
            introCopy: blockIntro,
            isAssessment: isAssessmentModule,
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
    parseLessonCompletionTime(meta) {
        const completionTime = meta.time;
        try {
            const timeParts = completionTime.split(' ');
            return {
                value: parseInt(timeParts[0], 10),
                units: timeParts[1]
            }
        } catch (error) {
            throw Error(`error parsing completion time for ${meta.name}: '${completionTime}'`)
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
            isAssessment: this.challengeIsAssessment(challenge),
            order: challenge.challengeOrder
        }
    }

    /**
     * Determines if a challenge is an assessment and therefore
     * required to be accomplished to earn certification. 
     * 
     * The business logic here comes from FCC's source code and 
     * their definition of challengeTypes.
     * 
     * @param {Object} challenge an FCC challenge object
     * @returns {boolean} true if the challenge is an assessment, false if not
     */
    challengeIsAssessment(challenge) {
        const challengeTypes = this.challengeTypes;
        const challengeType = challenge.challengeType;

        if (typeof challengeType !== 'number')
            throw Error(
                'freeCodeCamp challengeType must be a number, challenge: ' +
                JSON.stringify(challenge, null, 2)
            );
        return (
            challengeType === challengeTypes.frontEndProject ||
            challengeType === challengeTypes.backEndProject ||
            challengeType === challengeTypes.jsProject ||
            challengeType === challengeTypes.pythonProject ||
            challengeType === challengeTypes.codeAllyCert ||
            challengeType === challengeTypes.multifileCertProject
        );
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
            let moduleCompletionTimes = [];

            const blockIntros = course.blockIntros;

            for (const [key, block] of Object.entries(course.blocks)) {
                const meta = block.meta;
                const lessons = this.parseChallenges(block.challenges);
                const isAssessmentModule = this.moduleContainsAssessmentLesson(lessons);
                const intros = blockIntros[key].intro;

                const module = {
                    key: meta.dashedName || key,
                    meta: this.parseModuleMeta(key, isAssessmentModule, meta, intros),
                    lessons: lessons
                }

                course.modules.push(module);
                moduleCompletionTimes.push(module.meta.estimatedCompletionTime);
            }

            course.estimatedCompletionTime = this.computeCourseCompletionTime(course, moduleCompletionTimes);

            // sort the modules in the order they should be shown
            course.modules.sort(this.compareModules);

            // remove the raw curriculum data that's no longer needed
            delete course.blocks;
            delete course.blockIntros;
        })

        return rawCourses;
    }

    /**
     * Checks if any lesson in an array of lessons is 
     * an assessment.
     * 
     * @param {Array of Objects} lessons array of lessons
     * @returns true if any lesson is an assessment
     */
    moduleContainsAssessmentLesson(lessons) {
        return lessons.some(lesson => lesson.isAssessment)
    }

    /**
     * Computes the overall estimated course completion time based on the estimate time for each module. 
     * The module completion time is represented as an object of the form:
     *   {
     *     value: 5,
     *     units: 'hours'
     *   }
     * This function aggregates the times for all of the same units into a new object with the units 
     * and the summed times. 
     * 
     * TODO: for now it only expects one time unit (hours) and will throw an error if more than one 
     * time unit is listed, for example if some modules are estimated in hours and others in minutes.
     * 
     * @param {Array} moduleCompletionTimes array of objects containing time units and value for each module's completion time
     * @returns an array of summed times for each unit present (most typically just hours, but trying to be flexible here)
     */
    computeCourseCompletionTime(course, moduleCompletionTimes) {
        let completionTimes = [];

        moduleCompletionTimes.reduce(function (res, time) {
            // Handle single units by converting them to plural
            if (time.units.slice(-1) !== "s") { time.units = time.units.concat("s") }

            if (!res[time.units]) {
                res[time.units] = { units: time.units, value: 0 };
                completionTimes.push(res[time.units])
            }
            res[time.units].value += time.value;
            return res;
        }, {})

        if (completionTimes.length > 1) {
            console.log(`Computing completion time for course ${course.key}, found:`)
            completionTimes.forEach(t => console.log(t));
            throw "Found more than one time unit in module completion times"
        }
        return completionTimes[0];
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