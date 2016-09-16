// third-party
const zipUtil = require('zip-util');
const express = require('express');

module.exports = function (app, options) {

  const errors = app.errors;

  app.use(
    '/static/:domain',
    function (req, res, next) {

      app.services.logging.info({
        event: 'website-content-request',
        path: req.path,
        domain: req.params.domain
      });

      next();
    },
    app.middleware.loadWebsite({
      hostDomain: options.hostDomain,
    }),
    app.middleware.ensureWebsiteReady()
  );
  app.use('/static', express.static(options.websitesServerFsRoot));
};
