const { MongoClient, ServerApiVersion } = require('mongodb');
const { MONGOHQ_URL } = process.env;

const client = new MongoClient(MONGOHQ_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});

const dbName = 'freecodecamp';
const collectionName = 'user';

async function findUsers(query = {}) {
    try {
        await client.connect();

        const collection = client.db(dbName).collection(collectionName);

        const options = {
            projection: {
                username: 1,
                externalId: 1,
                name: 1,
                email: 1,
                completedChallenges: 1,
            },
        }

        let users = [];
        const cursor = collection.find({}, options)
        await cursor.forEach(user => users.push(user));

        return users;
    } catch (error) {
        console.error
        return null
    } finally {
        await client.close();
    }
}

async function getCompletedChallengesForAllUsers() {
    const users = await findUsers();
    console.log("** FCC users found:", users.length);

    let completedUserChallenges = [];
    for (let user of users) {
        const completedChallenges = user.completedChallenges.map(ch => {
            return {
                id: ch.id,
                completedDate: ch.completedDate
            }
        });

        const userData = {
            userId: user.externalId.split('|')[1],
            email: user.email,
            completedChallenges: completedChallenges
        }

        completedUserChallenges.push(userData);
    }

    return completedUserChallenges;
}

module.exports = {
    findUsers,
    getCompletedChallengesForAllUsers
}