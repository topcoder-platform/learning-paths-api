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

const learnerLevels = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    EXPERT: 'Expert',
    ALL_LEVELS: 'All Levels'
}

const resourceProviders = {
    freeCodeCamp: PROVIDER_FREECODECAMP,
}

const LESSON_PREVIOUSLY_COMPLETED = "lesson_previously_completed";
const LESSON_COMPLETED_SUCCESSFULLY = "lesson_successfully_completed";

const lessonCompletionStatuses = {
    previouslyCompleted: LESSON_PREVIOUSLY_COMPLETED,
    completedSuccessfully: LESSON_COMPLETED_SUCCESSFULLY
}

const TCApaymentIdentity = {
    sourceApplicationId: 'TCA',
    sourceApplicationName: 'Topcoder Academy'
}

module.exports = {
    enrollmentStatuses,
    learnerLevels,
    lessonCompletionStatuses,
    progressStatuses,
    resourceProviders,
    TCApaymentIdentity,
}