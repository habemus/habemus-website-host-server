const fs   = require('fs');
const path = require('path');

const should = require('should');
const Bluebird = require('bluebird');
const mockery  = require('mockery');
const fse      = require('fs-extra');

// load zip-util before mocking it
const zipUtil  = require('zip-util');

// auxiliary
const aux = require('../../aux');

describe('websiteCtrl', function () {

  var ASSETS;
  var websiteCtrl;

  beforeEach(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    /**
     * Mock HWebsiteClientPrivateClient
     */
    function HWMClientMock() {}
    HWMClientMock.prototype.getWebsite = function (authToken, domain) {
      return Bluebird.resolve({
        zipSignedURL: domain + '.zip',
      });
    }
    mockery.registerMock(
      '../../lib/h-website-manager-private-client',
      HWMClientMock
    );

    /**
     * Mock zip-util
     */
    mockery.registerMock('zip-util', {
      zipDownload: function (url, destinationPath) {
        var sourcePath = path.join(aux.fixturesPath, url);

        return zipUtil.unzip(sourcePath, destinationPath);
      }
    });

    // re-require the website server app
    // after enabling mockery
    const createWebsiteServer = require('../../../server');
    
    return aux.setup()
      .then((assets) => {

        ASSETS = assets;

        var options = aux.genOptions();

        ASSETS.websiteServerApp = createWebsiteServer(options);

        return ASSETS.websiteServerApp.ready;
      })
      .then(() => {
        websiteCtrl = ASSETS.websiteServerApp.controllers.website;
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });

  });

  afterEach(function () {
    mockery.disable();
    
    return aux.teardown();
  });

  describe('#loadWebsiteFiles(domain)', function () {

    it('load the website\'s files into place', function () {
      return websiteCtrl.loadWebsiteFiles('www.website-1.com');
    });

  });
});
