module.exports = function (app, options) {

  const rabbitMQSvc = app.services.rabbitMQ;

  function handleDeleted() {

  }

  return rabbitMQSvc.channel.consume(
    rabbitMQSvc.websiteEventQueues.updated,
    handleDeleted
  );
};
