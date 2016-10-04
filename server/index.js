// third-party
const express = require('express');
const uuid    = require('uuid');

// own
const setupServices = require('./services');
const setupEventHandlers = require('./event-handlers');

/**
 * Function that starts the host server
 */
function createWebsiteServer(options) {
  if (!options.apiVersion) { throw new Error('apiVersion is required'); }
  if (!options.hWebsiteURI) { throw new Error('hWebsiteURI is required'); }
  if (!options.hWebsiteToken) { throw new Error('hWebsiteToken is required'); }
  if (!options.rabbitMQURI) { throw new Error('rabbitMQURI is required'); }
  if (!options.websitesStorageFsRoot) { throw new Error('websitesStorageFsRoot is required'); }
  if (!options.websitesServerFsRoot) { throw new Error('websitesServerFsRoot is required'); }
  if (!options.hostDomain) { throw new Error('hostDomain is required'); }
  
  // create express app instance
  var app = express();

  // create an id that uniquely identifies the instance of the application
  // to other services
  app.id = 'h-website-server-' + uuid.v4();

  // make constants available throughout the application
  app.constants = require('../shared/constants');

  // make the error constructors available throughout the application
  app.errors = require('../shared/errors');
  
  app.ready = setupServices(app, options).then(() => {
    
    // instantiate controllers
    app.controllers = {};
    app.controllers.website =
      require('./controllers/website')(app, options);

    // instantiate middleware for usage in routes
    app.middleware = {};
    app.middleware.loadWebsite =
      require('./middleware/load-website').bind(null, app);
    app.middleware.ensureWebsiteReady =
      require('./middleware/ensure-website-ready').bind(null, app);
    
    // define description route
    app.get('/hello', function (req, res) {
      var msg = app.services.messageAPI.item({
        name: 'h-website-server',
        id: app.id,
      }, { name: true });

      res.json(msg);
    });
  
    // load routes
    require('./routes/website')(app, options);

    // load error-handlers
    require('./error-handlers/h-website-server-errors')(app, options);
  
    // load cron jobs and start them
    app.cron = {};

    // load event-handlers
    return setupEventHandlers(app, options).then(() => {
      return app;
    });
  });

  return app;
}

module.exports = createWebsiteServer;