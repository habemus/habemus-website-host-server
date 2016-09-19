module.exports = function (app, options) {

  const rabbitMQSvc = app.services.rabbitMQ;

  function handleCreated() {

  }

  return rabbitMQSvc.channel.consume(
    rabbitMQSvc.websiteEventQueues.updated,
    handleCreated
  );
};
