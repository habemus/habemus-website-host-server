// third-party dependencies
const Bluebird = require('bluebird');
const zipUtil  = require('zip-util');

// constants
const CONSTANTS = require('../../../shared/constants');

module.exports = function (app, options) {

  const errors = app.errors;
  const H_WEBSITE_MANAGER_PRIVATE_AUTH_TOKEN = options.hWebsiteManagerPrivateAuthToken;
  const WEBSITES_FS_ROOT = options.websitesFsRoot;

  var websiteCtrl = {};

  websiteCtrl.loadWebsiteFiles = function (domain) {
    if (!domain) {
      return Bluebird.reject(new errors.InvalidOption('domain', 'required'));
    }

    var websiteRootPath = WEBSITES_FS_ROOT + '/' + domain;

    return app.services.hwm.getWebsite(
        H_WEBSITE_MANAGER_PRIVATE_AUTH_TOKEN,
        domain
      )
      .then((website) => {
        return zipUtil.zipDownload(website.zipSignedURL, websiteRootPath);
      });
  };

  return websiteCtrl;
};