const fs   = require('fs');
const path = require('path');
const url  = require('url');

const should   = require('should');
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
    // mockery.enable({
    //   warnOnReplace: false,
    //   warnOnUnregistered: false,
    //   useCleanCache: true
    // });

    // /**
    //  * Mock HWebsiteClientPrivateClient
    //  */
    // function HWMClientMock() {}
    // HWMClientMock.prototype.getWebsite = function (authToken, domain) {
    //   return Bluebird.resolve({
    //     zipSignedURL: domain + '.zip',
    //   });
    // }
    // mockery.registerMock(
    //   '../../lib/h-website-manager-private-client',
    //   HWMClientMock
    // );

    // /**
    //  * Mock zip-util
    //  */
    // mockery.registerMock('zip-util', {
    //   zipDownload: function (url, destinationPath) {

    //     console.log(url);

    //     var sourcePath = path.join(aux.fixturesPath, url);

    //     return zipUtil.unzip(sourcePath, destinationPath);
    //   }
    // });

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
    // mockery.disable();
    
    return aux.teardown();
  });

  describe('#isStorageReady(website)', function () {
    it('should return false if the website\'s files are not in place', function () {

      return websiteCtrl.isStorageReady({
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          value: 'disabled',
          reason: 'TestReason',
        },
        activeDomainRecords: []
      })
      .then((isReady) => {
        isReady.should.eql(false);
      });

    });

    it('should return true if the website\'s files are in place', function () {

      // create the files
      fse.copySync(
        aux.fixturesPath + '/website-1.com',
        aux.tmpPath + '/websites-storage/src/some-website-id'
      );
      fse.copySync(
        aux.fixturesPath + '/website-1.com',
        aux.tmpPath + '/websites-storage/badged/some-website-id'
      );

      return websiteCtrl.isStorageReady({
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          // disabled: check for badged version as well
          value: 'disabled',
          reason: 'TestReason',
        },
        activeDomainRecords: []
      })
      .then((isReady) => {
        isReady.should.eql(true);
      });
    });

    it('should take into account that websites with billingStatus.value === enabled do not need the badged version', function () {
      // create the files
      fse.copySync(
        aux.fixturesPath + '/website-1.com',
        aux.tmpPath + '/websites-storage/src/some-website-id'
      );

      return websiteCtrl.isStorageReady({
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          value: 'enabled',
          reason: 'TestReason',
        },
        activeDomainRecords: []
      })
      .then((isReady) => {
        isReady.should.eql(true);
      });
    });

  });

  describe('#setupStorage(website)', function () {
    it('should load the websites files into the storage', function () {

      var website = {
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          value: 'disabled',
          reason: 'TestFailureReason',
        },
        activeDomainRecords: [],
        readSignedURL: 'http://localhost:9000/files/website-1.com.zip',
      };

      return websiteCtrl.setupStorage(website)
        .then(() => {

          // check that the files are in place
          return websiteCtrl.isStorageReady(website);

        })
        .then((isReady) => {
          isReady.should.eql(true);
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });

    });
  });
});
