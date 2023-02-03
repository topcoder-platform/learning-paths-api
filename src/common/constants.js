const STATUS_COMPLETED = "completed";
const STATUS_IN_PROGRESS = "in-progress";
const STATUS_NOT_STARTED = "not-started";

const PROVIDER_FREECODECAMP = "freeCodeCamp";

const progressStatuses = {
    completed: STATUS_COMPLETED,
    inProgress: STATUS_IN_PROGRESS,
    notStarted: STATUS_NOT_STARTED,
}

const resourceProviders = {
    freeCodeCamp: PROVIDER_FREECODECAMP,
}

module.exports = {
    progressStatuses,
    resourceProviders,
}