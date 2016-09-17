// third-party
const Bluebird = require('bluebird');

const WebsiteManagerPrivateClient = require('h-website-manager/client/private');

module.exports = function (app, options) {

  return Bluebird.resolve(new WebsiteManagerPrivateClient({
    serverURI: options.hWebsiteManagerURI,
  }));
};
