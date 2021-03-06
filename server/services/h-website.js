// third-party
const Bluebird = require('bluebird');

const PrivateHWebsiteClient = require('habemus-website-client/private');

module.exports = function (app, options) {

  return Bluebird.resolve(new PrivateHWebsiteClient({
    serverURI: options.hWebsiteURI,
  }));
};
