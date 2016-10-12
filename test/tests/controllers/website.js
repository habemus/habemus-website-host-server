const fs   = require('fs');
const path = require('path');
const url  = require('url');

const should   = require('should');
const Bluebird = require('bluebird');
const mockery  = require('mockery');
const fse      = require('fs-extra');
const cheerio  = require('cheerio');

// load zip-util before mocking it
const zipUtil  = require('zip-util');

// auxiliary
const aux = require('../../aux');

describe('websiteCtrl', function () {

  var ASSETS;
  var websiteCtrl;

  beforeEach(function () {

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
        signedURL: 'http://localhost:9000/files/website-1.com.zip',
      };

      return websiteCtrl.setupStorage(website)
        .then(() => {

          // check that the files are in place
          return websiteCtrl.isStorageReady(website);

        })
        .then((isReady) => {
          isReady.should.eql(true);

          // check that the 'index.html' file in the badged version
          // has the injected html string
          var badgedIndexHTML = fse.readFileSync(
            path.join(aux.tmpPath, 'websites-storage/badged/some-website-id/index.html'),
            'utf8'
          );
          var $ = cheerio.load(badgedIndexHTML);
          $('#test').length.should.eql(1);
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });

    });
  });

  describe('#setupServers(website)', function () {
    it('should generate links from the server paths to the website\'s storage', function () {
      
      var website = {
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          value: 'disabled',
          reason: 'TestFailureReason',
        },
        activeDomainRecords: [
          {
            domain: 'test-domain.com'
          }
        ],
        signedURL: 'http://localhost:9000/files/website-1.com.zip',
      };

      return websiteCtrl.setupStorage(website)
        .then(() => {
          return websiteCtrl.setupServers(website);
        })
        .then(() => {
          // check that the required links are in place and pointing
          // to the correct paths
          var link1Path = path.join(aux.tmpPath, 'websites-server/some-website-code.habemus.website');
          var link1Stat = fs.lstatSync(link1Path);
          var link1Target = fs.readlinkSync(link1Path);
          link1Stat.isSymbolicLink().should.eql(true);
          link1Target.should.eql(path.join(aux.tmpPath, 'websites-storage/src/some-website-id'));

          var link2Path = path.join(aux.tmpPath, 'websites-server/test-domain.com');
          var link2Stat = fs.lstatSync(link2Path);
          var link2Target = fs.readlinkSync(link2Path);
          link2Stat.isSymbolicLink().should.eql(true);
          // the billing is not enabled, thus the custom domain will link to badged version of website
          link2Target.should.eql(path.join(aux.tmpPath, 'websites-storage/badged/some-website-id'));
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });

    });
    
    it('should load the storage files if they have not yet been loaded', function () {
      var website = {
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          value: 'disabled',
          reason: 'TestFailureReason',
        },
        activeDomainRecords: [
          {
            domain: 'test-domain.com'
          }
        ],
        signedURL: 'http://localhost:9000/files/website-1.com.zip',
      };

      return websiteCtrl.setupServers(website)
        .then(() => {
          // check that the required links are in place and pointing
          // to the correct paths
          var link1Path = path.join(aux.tmpPath, 'websites-server/some-website-code.habemus.website');
          var link1Stat = fs.lstatSync(link1Path);
          var link1Target = fs.readlinkSync(link1Path);
          link1Stat.isSymbolicLink().should.eql(true);
          link1Target.should.eql(path.join(aux.tmpPath, 'websites-storage/src/some-website-id'));

          var link2Path = path.join(aux.tmpPath, 'websites-server/test-domain.com');
          var link2Stat = fs.lstatSync(link2Path);
          var link2Target = fs.readlinkSync(link2Path);
          link2Stat.isSymbolicLink().should.eql(true);
          // the billing is not enabled, thus the custom domain will link to badged version of website
          link2Target.should.eql(path.join(aux.tmpPath, 'websites-storage/badged/some-website-id'));

          var storageSrcPath    = path.join(aux.tmpPath, 'websites-storage/src/some-website-id');
          var storageBadgedPath = path.join(aux.tmpPath, 'websites-storage/badged/some-website-id');

          var srcStat = fs.lstatSync(storageSrcPath);
          var badgedStat = fs.lstatSync(storageBadgedPath);

          srcStat.isDirectory().should.eql(true);
          badgedStat.isDirectory().should.eql(true);
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });
    });
  });
  
  describe('#areServersReady(website)', function () {

    it('should return false in case the symlinks are not in place', function () {
      var website = {
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          value: 'disabled',
          reason: 'TestFailureReason',
        },
        activeDomainRecords: [
          {
            domain: 'test-domain.com'
          }
        ],
        signedURL: 'http://localhost:9000/files/website-1.com.zip',
      };

      return websiteCtrl.setupStorage(website)
        .then(() => {
          return websiteCtrl.areServersReady(website);
        })
        .then((ready) => {
          ready.should.eql(false);
        });
    });

    it('should return false in case a new domain is required', function () {
      var websiteV1 = {
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          value: 'disabled',
          reason: 'TestFailureReason',
        },
        activeDomainRecords: [
          {
            domain: 'test-domain.com'
          }
        ],
        signedURL: 'http://localhost:9000/files/website-1.com.zip',
      };

      // same id, same code, new domain
      var websiteV2 = {
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          value: 'disabled',
          reason: 'TestFailureReason',
        },
        activeDomainRecords: [
          {
            domain: 'test-domain.com'
          },
          {
            domain: 'another-domain.com',
          }
        ],
        signedURL: 'http://localhost:9000/files/website-1.com.zip',
      };

      return websiteCtrl.setupServers(websiteV1)
        .then(() => {
          return Bluebird.all([
            websiteCtrl.areServersReady(websiteV1),
            websiteCtrl.areServersReady(websiteV2)
          ]);
        })
        .then((results) => {
          results[0].should.eql(true);
          results[1].should.eql(false);
        });
    });
  });
});
