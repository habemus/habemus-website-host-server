// third-party
const express = require('express');

// own
const setupServices = require('./app/services');

/**
 * Function that starts the host server
 */
function createWebsiteServer(options) {
  if (!options.apiVersion) { throw new Error('apiVersion is required'); }
  if (!options.hWebsiteManagerURI) { throw new Error('hWebsiteManagerURI is required'); }
  if (!options.hWebsiteManagerPrivateAuthToken) {
    throw new Error('hWebsiteManagerPrivateAuthToken is required');
  }
  // if (!options.rabbitMQURI) { throw new Error('rabbitMQURI is required'); }
  if (!options.redisURI) { throw new Error('redisURI is required'); }
  if (!options.websitesStorageFsRoot) { throw new Error('websitesStorageFsRoot is required'); }
  if (!options.websitesServerFsRoot) { throw new Error('websitesServerFsRoot is required'); }
  if (!options.hostDomain) { throw new Error('hostDomain is required'); }

  /**
   * Option that enables the private API routes.
   * @type {Boolean}
   */
  options.enablePrivateAPI = options.enablePrivateAPI || false;

  
  // create express app instance
  var app = express();

  // make constants available throughout the application
  app.constants = require('../shared/constants');

  // make the error constructors available throughout the application
  app.errors = require('../shared/errors');
  
  app.ready = setupServices(app, options).then(() => {
    
    // instantiate controllers
    app.controllers = {};
    app.controllers.website =
      require('./app/controllers/website')(app, options);

    // instantiate middleware for usage in routes
    app.middleware = {};
    app.middleware.authenticatePrivateAPI =
      require('./app/middleware/authenticate-private-api').bind(null, app);
    app.middleware.loadWebsite =
      require('./app/middleware/load-website').bind(null, app);
    app.middleware.ensureWebsiteReady =
      require('./app/middleware/ensure-website-ready').bind(null, app);
    
    // define description route
    app.get('/hello', function (req, res) {
      var msg = app.services.messageAPI.item({
        name: 'h-website-server'
      }, { name: true });

      res.json(msg);
    });
  
    // load routes
    require('./app/routes/website')(app, options);

    if (options.enablePrivateAPI) {

      if (!options.privateAPISecret) {
        throw new Error('privateAPISecret is required to enablePrivateAPI');
      }

      require('./app/routes/private-api')(app, options);
    }
  
    // load error-handlers
    require('./app/error-handlers/h-website-server-errors')(app, options);
  
    // load cron jobs and start them
    app.cron = {};

    return app;
  });

  return app;
}

module.exports = createWebsiteServer;