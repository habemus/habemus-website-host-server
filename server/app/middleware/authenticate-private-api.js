// third-party dependencies
const jwt = require('jsonwebtoken');

// constants
const BEARER_TOKEN_RE = /^Bearer\s+(.+)/;

// exports a function that takes the app and some options and
// returns the middleware
module.exports = function (app, options) {

  /**
   * Secret used to verify access to the private API
   * @type {String}
   */
  const PRIVATE_API_SECRET = options.privateAPISecret;

  const errors = app.errors;

  function parseToken(req) {
    var authorizationHeader = req.header('X-Private-Authorization');

    if (!authorizationHeader) { return false; }

    var match = authorizationHeader.match(BEARER_TOKEN_RE);

    if (!match) {
      return false;
    } else {
      return match[1];
    } 
  }

  return function (req, res, next) {
    var token = parseToken(req);

    // verify the token
    jwt.verify(token, PRIVATE_API_SECRET, (err, decoded) => {
      if (err) {
        next(new errors.InvalidToken());
      } else {

        req.privateTokenData = decoded;
        next();
      }
    });
  };
};
