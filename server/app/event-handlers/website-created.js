// third-party
const Bluebird = require('bluebird');

// own
const aux = require('./aux');

module.exports = function (app, options) {

  const rabbitMQSvc = app.services.rabbitMQ;

  function handleCreated(message) {

    try {
      var payload = aux.parseMessagePayload(message);
    } catch (e) {
      // message is invalid
      // nack the message and DO NOT requeue
      rabbitMQSvc.channel.nack(message, false, false);

      app.services.logging.error(
        'event:website.created - received unsupported message type/format',
        e
      );

      return;
    }

    app.services.websiteSetupManager.reset(payload.website)
      .then(() => {
        app.services.logging.info('event:website.created - handled', payload.website);
      });
  }

  return rabbitMQSvc.channel.consume(
    rabbitMQSvc.websiteEventQueues.created,
    handleCreated
  );
};
