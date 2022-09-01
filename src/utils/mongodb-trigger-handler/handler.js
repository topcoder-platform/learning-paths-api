'use strict';

const axios = require('axios').default;
const config = require('config');
const helper = require('./helper');

module.exports.handle = async (event) => {
  // console.log("event", JSON.stringify(event, null, 2));

  const userId = event.detail.fullDocument.externalId.split("|")[1];
  const updatedFields = event.detail.updateDescription.updatedFields;

  const keyRegex = /^completedChallenges/;
  const completedChallengeKey = Object.keys(updatedFields).find(key => key.match(keyRegex));
  const challengeId = updatedFields[completedChallengeKey]['id'];
  const completedDate = updatedFields[completedChallengeKey]['completedDate'];

  const apiEndpoint = config.LEARNING_PATHS_API_ENDPOINT;

  const params = {
    userId: userId,
    lessonId: challengeId
  }

  const token = await helper.getM2MToken();

  const headers = {
    Authorization: `Bearer ${token}`
  }

  const config = {
    params: params,
    headers: headers
  }

  // call the Learning Paths API endpoint to complete the lesson
  axios.put(apiEndpoint, null, config)
    .then(function (response) {
      console.log("mongodb trigger handler: completed lesson", challengeId, "at", completedDate);
    })
    .catch(function (error) {
      console.error(error);
    });
};
