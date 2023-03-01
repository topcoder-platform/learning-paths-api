This README lists the API endpoints that need to be rehosted with Postgres data in order to support the React front-end application.

```
GET certifications/?providerName
GET certifications/<certificationId>?providerName

GET courses/?certification&provider



GET certification-progresses/?userId&provider&certification

POST certification-progresses/:userId/:certificationId/:courseId?lesson&module
PUT certification-progresses/:certificationProgressId/honesty-policy

PUT certification-progresses/:certificationProgressId/current-lesson/?currentLesson
PUT certification-progresses/:certificationProgressId/complete-lesson/?currentLesson

PUT certification-progresses/:certificationProgressId/complete-certification/?certificateAlternateParams[view-style]=large-container&certificateElement=[data-id=certificate-container]&certificateUrl

PUT shortcut-fcc-course-completion/:certificationProgressId
```