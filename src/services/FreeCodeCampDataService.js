const { MongoClient, ServerApiVersion } = require('mongodb');
const { MONGOHQ_URL } = process.env;

const client = new MongoClient(MONGOHQ_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1 // this only applies to Mongo Cloud, comment out for local
});

const dbName = 'freecodecamp';
const userCollection = 'user';

async function findUsers(query = {}) {
    try {
        await client.connect();

        const collection = client.db(dbName).collection(userCollection);

        const options = {
            projection: {
                username: 1,
                externalId: 1,
                name: 1,
                email: 1,
                completedChallenges: 1,
                progressTimestamps: 1,
            },
        }

        let users = [];
        const cursor = collection.find(query, options)

        await cursor.forEach(user => users.push(user));

        return users;
    } catch (error) {
        console.log(error);
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

async function addCompletedLessons(userExternalId, completedLessons, progressTimestamps) {
    try {
        await client.connect();
        const users = client.db(dbName).collection(userCollection);
        const result = await users.updateOne(
            { externalId: userExternalId },
            {
                $push:
                {
                    completedChallenges: {
                        $each: completedLessons
                    },
                    progressTimestamps: {
                        $each: progressTimestamps
                    }
                }
            }
        )

        return result
    } catch (error) {
        console.error(error)
    } finally {
        await client.close();
    }
}

module.exports = {
    addCompletedLessons,
    findUsers,
    getCompletedChallengesForAllUsers
}