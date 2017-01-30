// native
const fs = require('fs');
const path = require('path');

// third-party
const zipUtil = require('zip-util');
const express = require('express');
const serveStatic = require('serve-static');
const rootPathBuilder = require('root-path-builder');

module.exports = function (app, options) {

  const errors = app.errors;

  /**
   * The root path builder for websites paths
   * @type {rootPathBuilder}
   */
  const websitesServerRoot = rootPathBuilder(options.websitesServerFsRoot);

  /**
   * ATTENTION!
   * Middleware order and definition order are important
   * 
   * First set the website loading middleware
   * so that if the website is not found, the application's overall 404
   * error will be triggered.
   * 
   */
  app.use(
    '/website/:domain',
    function (req, res, next) {

      app.services.logging.info({
        event: 'website-content-request',
        path: req.path,
        domain: req.params.domain
      });

      next();
    },

    // first attempt to serve files
    serveStatic(function getRoot(req) {
      return websitesServerRoot.prependTo(req.params.domain);
    }, {
      // TODO: nginx does serve dot files. we should make them behave exactly the same
      dotfiles: 'ignore',
      fallthrough: true
    }),

    // then lazily load the website
    app.middleware.loadWebsite({
      hostDomain: options.hostDomain,
      hWebsiteToken: options.hWebsiteToken,
    }),
    app.middleware.ensureWebsiteReady(),

    // serve files
    serveStatic(function getRoot(req) {
      return websitesServerRoot.prependTo(req.params.domain);
    }, {
      dotfiles: 'ignore',
      fallthrough: false
    }),

    /**
     * Should handle only '404' for websites that do exist.
     * Websites that are completely not found should be dealt
     * with in another error handler.
     */
    function handleWebsiteFileNotFound(err, req, res, next) {
      
      if (err.status === 404) {
        // check if there is an error page for the website
        
        var notFoundPagePath = websitesServerRoot.prependTo(
          path.join(req.params.domain, 'errors/404.html')
        );

        fs.stat(notFoundPagePath, (err, stat) => {

          if (err) {
            if (err.code === 'ENOENT') {
              // no error page
              res.status(404).end();
            } {
              // not normal error
              next(err);
            }
            return;
          }

          if (stat.isFile()) {
            // read the file and send it
            res.status(404);
            fs.createReadStream(notFoundPagePath)
              .pipe(res)
              .on('error', next);
          } else {
            // no error page
            res.status(404).end();
          }
        });

      } else {
        next(err);
      }
    }
  );
};
