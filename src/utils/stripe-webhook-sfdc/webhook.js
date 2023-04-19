module.exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Stripe webhook handler",
        input: event,
      },
      null,
      2
    ),
  };
};