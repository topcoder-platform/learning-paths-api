const { MongoClient, ServerApiVersion } = require('mongodb');
const { MONGOHQ_URL } = process.env;

const client = new MongoClient(MONGOHQ_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});
const dbName = 'freecodecamp';

async function findUser(query) {
    try {
        await client.connect();

        const db = client.db(dbName);
        const user = db.collection('user');

        const options = {
            projection: {
                username: 1,
                externalId,
                name: 1,
                email: 1,
                completedChallenges: 1,
            },
        }
        const foundUser = await user.findOne(query, options);
        console.log(foundUser);
        return foundUser;
    } catch (error) {
        console.error
        return null
    } finally {
        await client.close();
    }
}

findUser({ email: 'chris.mccann@topcoder.com' })
// findUser({ externalId: 'auth0|90183094' })