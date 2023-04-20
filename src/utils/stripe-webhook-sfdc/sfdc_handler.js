module.exports.handle = async (event) => {
  console.log('SFDC handler', event);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "SFDC handler",
        input: event,
      },
      null,
      2
    ),
  };
};
