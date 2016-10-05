// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {

  app.services.hWebsiteEventsConsumer.on('created', function handleCreated(payload) {
    app.services.websiteSetupManager.reset(payload.website)
      .then(() => {
        app.services.logging.info('event:website.created - handled', payload.website);
      });
  });
};
