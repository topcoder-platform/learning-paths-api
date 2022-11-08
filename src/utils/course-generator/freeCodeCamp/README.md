# Update FCC Curriculum

This README explains how to update the _existing_ FCC courses from the source FCC repo.

To add a new course, see the [`How to add a new certification or course to an existing provider`](/src/utils/course-generator/README.md#how-to-add-a-new-certification-or-course-to-an-existing-provider) section of the main README.

## 1. Generate Source Curriculum in FCC App

First, we need to use the FCC app to regenerate its curriculum.

From the root of the FCC app, run:

```bash
npm run build:curriculum
```

This will create the updated curriculum in `/config/curriculum.json`.

## 2. Copy Source Files

The following source files from the FCC repo need to be copied to `/src/utils/course-generator/freeCodeCamp/source-files`.

- `/config/curriculum.json`
- `/client/i18n/locales/english/intro.json`

## 3. Perform Data Customizations

The following lists Topcoder-specific customizations to the original course data in the FCC app.

These should be handled in the FCC app itself, but it's a good idea to just verify they still exist before deploying.

1. Removed the "(New)" prefix in the name of the `2022/responsive-web-design` course in the `intro.json` file

2. TBD

## 4. Deploy Data

Follow instructions here for [deploying the data](/src/utils/course-generator/README.md#updating-dynamodb-with-the-generated-data) to the DB.
