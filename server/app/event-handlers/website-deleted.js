// third-party
const Bluebird = require('bluebird');

// own
const aux = require('./aux');

module.exports = function (app, options) {

  const rabbitMQSvc = app.services.rabbitMQ;

  function handleDeleted(message) {

    try {
      var payload = aux.parseMessagePayload(message);
    } catch (e) {
      // message is invalid
      // nack the message and DO NOT requeue
      rabbitMQSvc.channel.nack(message, false, false);

      app.services.logging.error(
        'event:website.deleted - received unsupported message type/format',
        e
      );

      return;
    }

    app.services.websiteSetupManager.ensureRemoved(payload.website)
      .then(() => {
        app.services.logging.info('event:website.deleted - handled', payload.website);
      });
  }

  return rabbitMQSvc.channel.consume(
    rabbitMQSvc.websiteEventQueues.deleted,
    handleDeleted
  );
};
