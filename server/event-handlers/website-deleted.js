// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {

  app.services.hWebsiteEventsConsumer.on('deleted', function handleDeleted(payload) {

    app.services.websiteSetupManager.ensureRemoved(payload.website)
      .then(() => {
        app.services.logging.info('event:website.deleted - handled', payload.website);
      });
  });

};
