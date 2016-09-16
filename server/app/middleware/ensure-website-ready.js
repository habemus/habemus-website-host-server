// third-party
const Bluebird = require('bluebird');

// exports a function that takes the app and some options and
// returns the middleware
module.exports = function (app, options) {
  const errors = app.errors;

  options = options || {};

  return function lazyLoadWebsite(req, res, next) {

    var website = req.website;

    app.services.websiteSetupManager.ensureReady(website)
      .then(() => {
        next();
      })
      .catch(next);
  };
};
