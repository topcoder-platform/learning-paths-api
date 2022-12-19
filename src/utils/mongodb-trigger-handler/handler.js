'use strict';

const axios = require('axios').default;
const config = require('config');
const helper = require('./helper');

const challengeKeyRegEx = /^completedChallenges/;
const completeChallengeEndpoint = config.LEARNING_PATHS_API_ENDPOINT;

module.exports.handle = async (event) => {
  console.log("event", JSON.stringify(event, null, 2));

  const userId = event.detail.fullDocument.externalId.split("|")[1];
  const updatedFields = event.detail.updateDescription.updatedFields;

  const challengeKeys = Object.keys(updatedFields).filter(key => key.match(challengeKeyRegEx));

  const token = await helper.getM2MToken();
  const headers = {
    Authorization: `Bearer ${token}`
  }

  // for each completed challenge, issue an API call to complete 
  // the lesson in the Learning Paths DynamoDB
  for (const completedChallengeKey of challengeKeys) {
    const challengeId = updatedFields[completedChallengeKey]['id'];

    const params = {
      userId: userId,
      lessonId: challengeId
    }

    const options = {
      params: params,
      headers: headers
    }

    // call the Learning Paths API endpoint to complete the lesson
    try {
      const response = await axios.put(completeChallengeEndpoint, null, options);
      console.log("API response", response.status);
      console.log("mongodb trigger handler: completed lesson", challengeId);
    } catch (error) {
      console.error(error);
    }
  }
};
