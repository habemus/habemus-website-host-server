// third-party
const URLPattern = require('url-pattern');

// exports a function that takes the app and some options and
// returns the middleware
module.exports = function (app, options) {

  const HOST_DOMAIN = options.hostDomain;
  const hostPattern = new URLPattern(':code.' + HOST_DOMAIN);

  const errors = app.errors;

  options = options || {};

  /**
   * Parses the given domain to check if it 
   * is a subdomain of the host domain.
   * 
   * @param  {String} domain
   * @return {String || Null}
   */
  function getCodeFromDomain(domain) {
    var match = hostPattern.match(domain);

    if (match) {
      return match.code;
    } else {
      return null;
    }
  }

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

    // attempt to get a code from the domain
    var code = getCodeFromDomain(domain);

    if (code) {
      // retrieve the website by its code
      app.services.hWebsiteManagerPrivate.getWebsite(code, 'byCode')
        .then((website) => {
          req.website = website;
        })
        .catch(next);

    } else {
      // retrieve the website by the domain
      app.services.hWebsiteManagerPrivate.getWebsite(domain, 'byActiveDomain')
        .then((website) => {
          req.website = website;
        })
        .catch(next);
    }

  };
};
