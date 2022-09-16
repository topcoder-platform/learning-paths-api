# Topcoder Academy Course Generator

The `course-generator` is a command line interface (CLI) tool that generates a JSON file containing Learning Path course metadata that describes the different course offerings available through Topcoder Academy. This metadata is imported into DynamoDB and exposed to the Learning Paths application via the [learning-paths-api](https://github.com/topcoder-platform/learning-paths-api).

## tl;dr - How do I run it?

From anywhere in the project directory:

```bash
$ npm run generate-courses
```

This will generate the course metadata for freeCodeCamp in the form of `./course-generator/freeCodeCamp/generated_courses.json`. Running it repeatedly with the same data will simply overwrite the output file.

## Basic Concept

Each educational partner (learning resource provider) with which Topcoder partners will most likely have its own proprietary course curriculum format. We want to be able to provide content from any provider within our standard Topcoder Academy Learning Paths application, which effectively "wraps" the course content with our own user experience while the provider's code editor or other tools are provided for user's to actually perform the learning exercises.

This approach requires us to have metadata about the course content external to the provider's own course content data. We store that data in our own DynamoDB metadata store in a generic way, to insulate our API and front-end code from changes required to support any particular provider. This requires us to extract the course metadata from each provider's learning resources (curriculum data, course descriptions, etc.) and import it into DynamoDB. 

When new courses are available, or when we partner with a new learning resource provider, we have to figure out how their course content is structured, build a custom parser/generator, and integrate it with the `generate-courses` CLI tool described here. 

*DISCLAIMER*: Since freeCodeCamp.org is our first partnership, the CLI tool was developed around their course structure and the resulting set of files that contain it. It also supports the URL structure that freeCodeCamp uses internally, and with which our course navigation tools integrate. The addition of other partners in the future will most likely require changes to our metadata approach, but such is life. We don't know what their content will look like until we see it.

## Course Generator file structure

The file structure of the course generator tool is important to its functionality and is shown below:
```
course-generator
|    generate-courses.js
|    providers.json
|    README.md (this file)
|
|----freeCodeCamp (learning resource provider 1)
|    |    parserGenerator.js
|    |    generated_courses.json
|    |
|    |----source-files
|    |        additional-data.json
|    |        certifications.json
|    |        curriculum.json
|    |        intro.json
|    
|----(learning resource provider 2)
|    |    parserGenerator.js
|    |    generated_courses.json
|    |
|    |----source-files
|    |        (source file 1)
|    |        (source file 2)
|    |        ...
...
|----(learning resource provider n)

```
### Top-level files
- `generate-courses.js` : the CLI tool that does the actual work
- `providers.json` : the list of learning resource providers whose content is available to generate
- `README.md` : Markdown-formatted README, which you are reading, right now.

The `providers.json` file follows this format:
```json
[
  {
    "id": "e8e74580-6586-4eb6-9023-bc758c742f1f",
    "name": "freeCodeCamp",
    "url": "freeCodeCamp.org",
    "attributionStatement": "This course was created by the <a href='https://www.freecodecamp.org'>freeCodeCamp.org community</a>."
  },
  ...
]
```
Each provider's format should be:
- `id` : The unique Topcoder-assigned ID for this provider
- `name` : The case-sensitive, unique name of this provider
- `url` : The URL to the provider's landing page (specified by the provider)
- `attributionStatement` : The usage and attribution statement shown in Topcoder Academy, as dictated by the licensing agreement with the provider

### Provider implementation files
Each supported learning resource provider is hosted in its own subdirectory along with its unique source files. 
- `parserGenerator.js` : the provider-specific parser and generator that extracts the course metadata
- `generated_courses.json` : the generated course metadata file (won't exist until you run the CLI tool, and is gitignored)
- `source-files` : contains the course curriculum information that is processed by the provider-specific parser
- `source-files/additional-data.json` : extra Topcoder-created attributes to add to courses and certifications
- `source-files/certifications.json` : lists the provider's certifications, in a generic format (see below)
- `source-files/(other content)` : provider-specific course curriculum and associated files (varies by provider)

Each `parserGenerator` class should expose a `generateCourseData()` method that the `generate-courses` CLI can import and call. What this code actually has to do is totally dependent on how the course curriculum data is structured by the specific provider. See the `freeCodeCamp` implementation for an example.

The `additional-data.json` file allows us to "decorate courses and certifications with our own attributes, and the file is formatted as shown below:

```json
{
    "course": {
        "2022/responsive-web-design": {
            "keyPoints": [
                "This Responsive Web Design course will help you learn ..."
            ],
            "completionSuggestions": [
                "We recommend you use the <b>Replit Starter Pack</b> method for completing this course."
            ]
        }
    }
}
```

Valid top-level keys are `course` and `certification`. The specific key of the item we want to decorate must be next, and then any valid JSON data for the attribute to be added. The end result is this data appears in the specific course or certification in the final generated course JSON data.

The provider `certifications.json` file follows a specific format for all providers, as shown here:
```json
[
  {
    "id": "9bd93a8a-1fcb-405a-b2e3-4a283915bbca",
    "key": "responsive-web-design-certification",
    "providerName": "freeCodeCamp",
    "providerCertificationId": "561add10cb82ac38a17513bc",
    "title": "Responsive Web Design Certification",
    "certification": "responsive-web-design",
    "completionHours": 300,
    "courses": [
      "2022/responsive-web-design"
    ],
    "state": "active",
    "category": "Web Development",
    "certType": "certification"
  },
  ...
]
```
A description of this file format:
- `id` : Topcoder's unique ID for this certification (assigned by this tool)
- `key` : provider's unique name for this certification among all of the provider's certifications
- `providerName` : Topcoder's name (case sensitive) for the learning resource provider
- `providerCertificationId` : provider's unique ID for the certification (can be missing for non-certification courses)
- `title` : provider's given title for this certification
- `certification` : provider's description of this certification
- `completionHours` : the number of hours the provider estimates this certification will require
- `courses` : an array of unique provider course names that must be completed to earn this certification
- `state` : the state of this certification in Topcoder's learning paths, currently either `active` or `coming-soon`. Only certifications in the `active` state will be generated to the metadata file by this tool.
- `category` : the Topcoder learning path category for this certification (valid values still TBD)
- `certType` : the Topcoder classification of whether the certificate earned is a certification, or a certificate of course completion (since some courses don't result in an "actual" certification)

Data from the provider's source files has to be collected and added manually to the `certifications.json` file. Some data, for example in the case of freeCodeCamp, is located in JavaScript source files, such as `config/certification-settings.ts`.

## Course metadata structure
Each provider's `generated_courses.json` metadata file should conform to the following format so that it can be loaded into the DynamoDB metadata table:

```json
[
  {
    "id": "5dce58e5-be9c-4e4b-ab4e-ffe5f10f1931",
    "provider": "freeCodeCamp",
    "key": "2022/responsive-web-design",
    "title": "(New) Responsive Web Design",
    "certification": "responsive-web-design",
    "completionHours": 300,
    "introCopy": [
      "In this Responsive Web Design Certification...",
      "First, you'll build a cat photo app...",
      "Finally, you'll learn how to ..."
    ],
    "note": "Note: Some browser extensions...",
    "modules": [
      {
        "key": "learn-html-by-building-a-cat-photo-app",
        "meta": {
          "name": "Learn HTML by Building a Cat Photo App",
          "dashedName": "learn-html-by-building-a-cat-photo-app",
          "order": 0,
          "estimatedCompletionTime": {
            "value": "5",
            "units": "hours"
          },
          "introCopy": [
            "HTML tags give a webpage...",
            "In this course, you'll learn..."
          ],
          "lessonCount": 67
        },
        "lessons": [
          {
            "id": "5dc174fcf86c76b9248c6eb2",
            "title": "Step 1",
            "dashedName": "step-1",
            "order": 0
          },
          ...
          {
            "id": "5ef9b03c81a63668521804ee",
            "title": "Step 67",
            "dashedName": "step-67",
            "order": 66
          }
        ],
        ...
    ]
```
The file contents:
- `id` : Unique ID assigned by Topcoder to this course
- `provider` : The provider of this course
- `key` : The unique name of this course from the provider
- `title` : The course name, given by the provider
- `certification` : The name of the provider certification under which this course falls
- `completionHours`: The provider's estimated number of hours to complete all course requirements
- `introCopy` : An array of descriptive sentences about this course, from the provider
- `note` : An optional note about this course that's shown on the course detail page
- `modules` : The array of modules (topics) that make up this course, whose structure is:
    - `key` : Provider-given unique name for this module
    - `meta` : Metadata about this module, with the following structure:
        - `name` : The provider-given name for this module
        - `dashedName` : URL-friendly name of the module, given by the provider
        - `order` : The provider order of this module in the list of modules
        - `estimatedCompletionTime` : The provider-given estimated time to complete the module, parsed into value and units
        - `introCopy` : A provider-given array of descriptive introductory statements about the module
    - `lessons` : The array of metadata about the lessons in this module, structured as:
        - `id` : The provider-given ID of this lesson
        - `title` : The provider-given title of this lesson
        - `dashedName` : The URL-friendly dashed name of this lesson
        - `order` : The provider order of this lesson in the list of lessons

## How to add a new certification or course to an existing provider

### Add a new certification
To add a new certification to an existing provider, edit the `certifications.json` file in the provider's directory, following the format specified above. The `id` field should be set to `"id": ""` and the tool will create and set a new UUID for the ID.

Be sure to add the unique course keys to the `courses` array. In order for the certification and its courses to be picked up by the generator tool, the certification's `state` must be set to `active`.

### Add a new course to an existing certification
Just add the course's unique key (name) to the certification's `courses` array. Assuming the course exists in the provider's curriculum file it should be picked up and output in the `generated-courses.json` file.

## How to add a new provider

### Add the provider to `providers.json`
Edit the `course-generator/providers.json` file to add the provider's information. Set the ID field as `"id": ""` and the tool will generate a UUID and rewrite the file.

### Add certification and curriculum and course data
Add a `certifications.json` file, following the format above, for the new provider. See "Add a new certification" above for details. 

Each new learning resource provider also requires us generate one or more files equivalent to freeCodeCamp's `curriculum.json` file, which contains all of their course data, as well as any additional files like `intro.json`, and place these files in the `<provider>/source-files` directory. 

### Implement `parserGenerator.js`
A provider-specific `parserGenerator.js` file will then have to be implemented to properly parse the curriculum data. This code will use the `source-files` to produce the generated course file. The provider's parser/generator will have to be imported into the `generate-courses` CLI tool and referenced appropriately. This parser/generator must output a properly formatted `generated_courses.json` file, following the format specified earlier.

# Updating DynamoDB with the generated data
To push the generated data into DynamoDB, provide the `-d` flag to the command:

```bash
$ npm run generate-courses -- -d 
```

The `DYAMODB_URL` environment variable determines where the data will be written, and defaults to localhost. If you want to write the data to DynamoDB in AWS you need to set that env var to point to AWS and provide a current set of AWS access key, secret key, and token for the target environment (dev or production), for example:

```bash
export DYNAMODB_URL="https://dynamodb.us-east-1.amazonaws.com"
export AWS_ACCESS_KEY_ID="ASIA3Z6ZVO4YOWE5ONBV"
export AWS_SECRET_ACCESS_KEY="etypTIZXWv8VRJbIynMJFoW8nA6Qdp8YtgpMOQIq6x"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEBwaCXVzLWVhc3QtMSJIMEYCIQDhBqOcC1BD4dh0/tBWXaeD8dF62/...."
```
