const STATUS_COMPLETED = "completed";
const STATUS_IN_PROGRESS = "in-progress";
const STATUS_NOT_STARTED = "not-started";
const STATUS_ENROLLED = "enrolled";
const STATUS_DISENROLLED = "disenrolled";

const PROVIDER_FREECODECAMP = "freeCodeCamp";

const progressStatuses = {
    completed: STATUS_COMPLETED,
    inProgress: STATUS_IN_PROGRESS,
    notStarted: STATUS_NOT_STARTED,
}

const enrollmentStatuses = {
    enrolled: STATUS_ENROLLED,
    completed: STATUS_COMPLETED,
    disenrolled: STATUS_DISENROLLED
}

const resourceProviders = {
    freeCodeCamp: PROVIDER_FREECODECAMP,
}

module.exports = {
    enrollmentStatuses,
    progressStatuses,
    resourceProviders,
}