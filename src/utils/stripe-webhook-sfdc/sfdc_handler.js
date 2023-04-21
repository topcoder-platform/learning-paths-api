const { SSMClient, PutParameterCommand } = require("@aws-sdk/client-ssm");

async function handle(event) {
  console.log('SFDC handler', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
  };
};

module.exports = {
  handle,
}