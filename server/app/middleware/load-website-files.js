// third-party
const URLPattern = require('url-pattern');
const zipUtil    = require('zip-util');

// exports a function that takes the app and some options and
// returns the middleware
module.exports = function (app, options) {

  const errors = app.errors;

  options = options || {};


  return function loadWebsiteFiles(req, res, next) {

    var website = req.website;

  };
};
