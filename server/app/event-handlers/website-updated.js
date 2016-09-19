// third-party
const Bluebird = require('bluebird');

// own
const aux = require('./aux');

module.exports = function (app, options) {

  const rabbitMQSvc = app.services.rabbitMQ;

  function handleUpdated(message) {

    try {
      var payload = aux.parseMessagePayload(message);
    } catch (e) {
      // message is invalid
      // nack the message and DO NOT requeue
      rabbitMQSvc.channel.nack(message, false, false);

      app.services.logging.error(
        'event:website-updated - received unsupported message type/format',
        e
      );

      return;
    }

    /**
     * The website's data comes in the `.website` property of 
     * the payload. Other properties of the payload
     * are reserved for meta information.
     * 
     * @type {Object}
     */
    var website = payload.website;

    Bluebird.all([
      app.controllers.website.unlinkStorage(website),
      app.controllers.website.unlinkServers(website),
    ])
    .then(() => {
      return app.controllers.website.setupServers(website);
    })
    .then(() => {
      console.log('servers set up', website);
      return rabbitMQSvc.channel.ack(message);
    });
  }

  return rabbitMQSvc.channel.consume(
    rabbitMQSvc.websiteEventQueues.updated,
    handleUpdated
  );
};
