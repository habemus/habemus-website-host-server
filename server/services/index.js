// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {
  
  // instantiate services
  app.services = {};
  
  return Bluebird.all([
    require('./logging')(app, options),
    require('./message-api')(app, options),
    require('./rabbit-mq')(app, options),
    require('./h-website')(app, options),
    require('./website-setup-manager')(app, options),
  ])
  .then((services) => {
    
    app.services.logging = services[0];
    app.services.messageAPI = services[1];
    app.services.rabbitMQ = services[2];
    app.services.hWebsite = services[3];
    app.services.websiteSetupManager = services[4];

    // setup second batch of services
    return Bluebird.all([
      require('./h-website-events-consumer')(app, options),
    ]);
  })
  .then((services) => {

    app.services.hWebsiteEventsConsumer = services[0];

    return;
  });
};