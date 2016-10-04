// third-party
const Bluebird = require('bluebird');

// own
const aux = require('./aux');

module.exports = function (app, options) {

  app.services.hWebsiteEventsConsumer.on('updated', function handleUpdated(payload) {

    console.log('handle updated!', payload);

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
        // if (isInServer) {
          return app.services.websiteSetupManager.reset(website);
        // } else {
          // return;
        // }
      })
      .then(() => {
        app.services.logging.info('event:website.updated - event handled', website);
      })
      .catch((err) => {

        app.services.logging.error('event:website.updated error', err);

        // TODO: study requeuing for h-mq-events!!!
        // nack and requeue, so that we can try again
        // return rabbitMQSvc.channel.nack(message, false, true);
      });
  })


};