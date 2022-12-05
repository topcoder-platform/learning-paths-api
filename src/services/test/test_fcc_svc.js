const service = require('../FreeCodeCampDataService');

(async () => {
    const query = { externalId: { $eq: 'auth0|88778750' } };

    const users = await service.findUsers(query);
    console.log(users[0])
})();