# LADR 01-initial-architecture-design - Nov 3, 2022

## Key Architectural Considerations 

The initial architecture of the Udemy course fetcher was implemented to do the following:
- Periodically retrieve the full course listing from the Udemy Business (UB) Courses API
- Filter the courses down to just the ones we want to make available in Topcoder Academy (TCA)
- Store the course listing in a database for review, querying, and access by the Learning Paths API
- Allow the detection of courses that have been removed from the UB course listing and remove them from display in TCA

## High-level Architecture Design

I made the decision to use a serverless design to implement this tool. The high-level design includes:
- A NodeJS-based Lambda function to retrieve the course data from the API and write it to the database
- An EventBridge rule to trigger the Lambda on a cron-based schedule, once per day
- A PostgreSQL database hosted in RDS to store the course data
- An S3 bucket to store the downloaded course file data as JSON, primarily for debugging and to keep a history of what was downloaded

## Database Design

I decided to use the Prisma ORM framework to support the database interactions required to read and write the course data. This allows us to reuse the various models in the Learning Paths API as well, where appropriate. It also allows us to migrate the database incrementally to add features to the models.

The key models in the database design are:
- Udemy Courses: the full course data retrieved from the API for all of the courses available in UB
- Topcoder Udemy Courses: the subset of courses that are available in TCA
- Data Version: the current version (timestamp) of the data; this table holds just one record, the current version

### Udemy Courses 
The Udemy Course API data is returned in JSON format and includes some simple nested structures, for example, the `primary_category`, which looks like this:
```
    "primary_category": {
        "_class": "course_category",
        "id": 302,
        "title": "Cloud Computing",
        "url": "/courses/ufb-cloud-computing/"
    }
```
For our purposes we only care about the `title` attribute, so this attribute is flattened to simply be the string "Cloud Computing". Other values in the course data are represented as arrays of objects, but these, too, can be flattened to just an array of strings. These transformations are made to the raw JSON data before the data is loaded into the database table using the Prisma model.

Some notes about courses being deprecated or removed from the course listing returned by the API: 
- Udemy Business does not expose the planned retirement or removal of a course via API or in any data attributes in the course data. They do keep a Google Sheet of planned retirements but this is not a viable mechanism for us to programmatically query for impending course deprecations. 
- Our UB contacts indicated that prominent messages are shown to users in the actual course content alerting them to the planned or impending removal of the course. 
- Once a course is removed, it simply does not appear in the data returned from the API, so it is incumbent on us to perform a "diff" to see what has been removed, if anything, and to take appropriate action on our side.

### Topcoder Udemy Courses
As of Nov 2022 there are over 17,000 courses available in Udemy Business, orders of magnitude more than we can realistically show or manage in TCA. While we filter the data coming out of the API to just a handful of categories we want to show this still results in several thousand courses. 

In order to allow us to curate the courses down to just the ones we want to make availalbe, I've added the Topcoder Udemy Courses table. It allows us to specify the course ID and a status for each course that we want to make available in TCA. We simply join on the Udemy Courses table by ID to retrieve any details we want to show in TCA and to get the course URL. This also gives us a mechanism to show or hide any particular course, as well as to mark a course as "removed" when it is not included in the course data retrieved from the UB API. 

Since, as described above, UB does not provide any automated mechanism or data attributes to indicate that a course is going to be removed from the course listing, we can "diff" the current course list against the courses in the Topcoder Udemy Courses table to determine if any courses we are currently displaying have been removed from UB. We then mark the course as "removed" in this table so it is no longer shown in the TCA course pages.

### Data Version
Regarding the Data Version table, this approach allows us to have all of the course data loaded into the table with a composite primary key of course ID and data version timestamp and simultaneously load a new version of the course data side-by-side. While the loading is happening the Data Version points to the existing data, so any queries for course data will only return the current courses. 

Once all of the new course data is loaded (with each record having a newer, later version timestamp), the Data Version is updated to the new version timestamp. At that moment, any queries for course data will return all of the new course data. The old version of the course data is then deleted so that only the latest data is in the Udemy Courses table.

This approach requires that any queries for course data retrieve the current Data Version value but this is easily accomplished.

