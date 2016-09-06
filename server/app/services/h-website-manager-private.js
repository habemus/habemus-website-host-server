// third-party
const Bluebird = require('bluebird');

const WebsiteManagerPrivateClient = require('../../lib/h-website-manager-private-client');

module.exports = function (app, options) {

  return Bluebird.resolve(new WebsiteManagerPrivateClient({
    serverURI: options.hWebsiteManagerURI,
  }));
};
