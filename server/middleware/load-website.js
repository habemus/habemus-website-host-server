// third-party
const URLPattern = require('url-pattern');

// exports a function that takes the app and some options and
// returns the middleware
module.exports = function (app, options) {

  const H_WEBSITE_TOKEN = options.hWebsiteToken;
  const HOST_DOMAIN     = options.hostDomain;
  const hostPattern     = new URLPattern(':code.' + HOST_DOMAIN);

  const errors = app.errors;

  options = options || {};

  /**
   * Function that retrieves the domain from the request object
   * 
   * @param  {Express Req} req
   * @return {String}
   */
  var _domain = function (req) {
    return req.params.domain;
  };

  return function loadWebsite(req, res, next) {

    var domain = _domain(req);

    // retrieve the website by the domain
    app.services.hWebsite.resolve(H_WEBSITE_TOKEN, domain)
      .then((website) => {
        req.website = website;
        next();
      })
      .catch((err) => {
        if (err.name === 'NotFound') {
          next(new errors.WebsiteNotFound('website', domain));
        } else {
          next(err);
        }
      });
  };
};
