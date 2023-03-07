const {
    updateEnrollments,
    getUserHandles,
    getUserNames
} = require("./update-user-names");

(async () => {
    const handles = await getUserHandles();
    console.log(handles);
    const names = await getUserNames(handles);
    console.log(names);
    await updateEnrollments(names);
})();