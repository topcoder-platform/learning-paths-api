# Update FCC Curriculum

This README explains how to update the FCC courses from the source FCC repo.

## Generate Source Curriculum in FCC App

First, we need to use the FCC app to regenerate its curriculum.

From the root of the FCC app, run:

```bash
npm run build:curriculum
```

This will create the updated curriculum in `/config/curriculum.json`.

## Source Files

The following source files from the FCC repo need to be copied to `/src/utils/course-generator/freeCodeCamp/source-files`.

- `/config/curriculum.json`
- `/client/i18n/locales/english/intro.json`

## Data Customizations

The following lists Topcoder-specific customizations to the course data that will need to occur each time the curriculum is updated.

1. Remove the "(New)" prefix in the name of the `2022/responsive-web-design-qa` course in the `intro.json` file

2. TBD

## Data Deployment

Follow instructions here for [deploying the data](/src/utils/course-generator/README.md#updating-dynamodb-with-the-generated-data) to the DB.
