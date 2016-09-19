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
        'event:website.updated - received unsupported message type/format',
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

    /**
     * Check whether the website exists in this server.
     * If so, reset it, otherwise ignore the update
     */
    app.controllers.website.isWebsiteInServer(website)
      .then((isInServer) => {
        if (isInServer) {
          return app.services.websiteSetupManager.reset(website);
        } else {
          return;
        }
      })
      .then(() => {
        app.services.logging.info('event:website.updated - event handled', website);
        return rabbitMQSvc.channel.ack(message);
      })
      .catch(() => {
        // nack and requeue, so that we can try again
        return rabbitMQSvc.channel.nack(message, false, true);
      });
  }

  return rabbitMQSvc.channel.consume(
    rabbitMQSvc.websiteEventQueues.updated,
    handleUpdated
  );
};
