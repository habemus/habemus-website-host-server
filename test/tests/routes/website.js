const fs   = require('fs');
const path = require('path');
const url  = require('url');

const should   = require('should');
const Bluebird = require('bluebird');
const mockery  = require('mockery');
const fse      = require('fs-extra');
const cheerio  = require('cheerio');

const HWebsiteClientPrivateClient = require('h-website-manager/client/private');

const superagent = require('superagent');

// load zip-util before mocking it
const zipUtil  = require('zip-util');

// auxiliary
const aux = require('../../aux');

describe('GET /websites/:domain/**/*', function () {

  var ASSETS;

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
    HWMClientMock.prototype.getWebsite = function (authToken, identifier, strategy) {

      strategy = strategy || 'byActiveDomain';

      switch (strategy) {
        case 'byActiveDomain':

          if (identifier === 'website-1.com') {
            return Bluebird.resolve(ASSETS.website);
          } else {
            return Bluebird.reject(new HWebsiteClientPrivateClient.errors.NotFound('website', identifier));
          }

          break;
        case 'byCode':

          if (identifier === 'some-website-code') {
            return Bluebird.resolve(ASSETS.website);
          } else {
            return Bluebird.reject(new HWebsiteClientPrivateClient.errors.NotFound('website', identifier));
          }

          break;
        default: 

          return Bluebird.reject(new HWebsiteClientPrivateClient.errors.NotFound('website', identifier));
          break;
      };
    }
    mockery.registerMock(
      'h-website-manager/client/private',
      HWMClientMock
    );

    const createWebsiteServer = require('../../../server');
    
    return aux.setup()
      .then((assets) => {

        ASSETS = assets;

        var options = aux.genOptions();

        ASSETS.websiteServerApp = createWebsiteServer(options);

        return ASSETS.websiteServerApp.ready;
      })
      .then(() => {
        // start the server
        ASSETS.websiteServerURI = 'http://localhost:8000';
        return aux.startServer(8000, ASSETS.websiteServerApp);
      })
      .then(() => {

        // setup a website
        var website = {
          _id: 'some-website-id',
          code: 'some-website-code',
          billingStatus: {
            value: 'disabled',
            reason: 'TestFailureReason',
          },
          activeDomainRecords: [
            {
              domain: 'website-1.com'
            }
          ],
          readSignedURL: 'http://localhost:9000/files/website-1.com.zip',
        };

        ASSETS.website = website;

        return ASSETS.websiteServerApp.controllers.website.setupServers(ASSETS.website);

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

  describe('retrieving a file for existing domain', function () {
    it('should retrieve the file by the `hosted domain`', function () {

      return new Bluebird((resolve, reject) => {
        superagent.get(ASSETS.websiteServerURI + '/website/some-website-code.habemus.website/index.html')
          .end((err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
      })
      .then((res) => {
        var filepath = path.join(aux.tmpPath, 'websites-storage/src/some-website-id/index.html');

        res.text.should.eql(fs.readFileSync(filepath, 'utf8'));
      })
      .catch((err) => {
        console.log(err);

        throw err;
      });
    });

    it('should retrieve the file by the `custom domain`', function () {
      return new Bluebird((resolve, reject) => {
        superagent.get(ASSETS.websiteServerURI + '/website/website-1.com/index.html')
          .end((err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
      })
      .then((res) => {
        // result should be badged
        var filepath = path.join(aux.tmpPath, 'websites-storage/badged/some-website-id/index.html');

        res.text.should.eql(fs.readFileSync(filepath, 'utf8'));
      });
    });

    it('should serve index.html when path matches directories', function () {
      return new Bluebird((resolve, reject) => {
        superagent.get(ASSETS.websiteServerURI + '/website/website-1.com')
          .end((err, res) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          })
      })
      .then((res) => {
        // result should be badged
        var filepath = path.join(aux.tmpPath, 'websites-storage/badged/some-website-id/index.html');

        res.text.should.eql(fs.readFileSync(filepath, 'utf8'));
      })
    });

    it('should return website\'s 404 error in case the file does not exist but the domain exists', function () {
      return new Bluebird((resolve, reject) => {
        superagent.get(ASSETS.websiteServerURI + '/website/website-1.com/file-that-does-not-exist.html')
          .end((err, res) => {
            if (err) {

              res.statusCode.should.eql(404);

              var errorPagePath = path.join(aux.tmpPath, 'websites-storage/badged/some-website-id/errors/404.html');

              res.text.should.eql(fs.readFileSync(errorPagePath, 'utf8'));

              resolve();

            } else {
              reject(new Error('error expected'));
            }
          });
      });
    });

    it('should return habemus\' 404 error in case the website does not exist', function () {

      return new Bluebird((resolve, reject) => {
        superagent.get(ASSETS.websiteServerURI + '/website/test-another-domain.com')
          .end((err, res) => {
            if (err) {

              var errorPagePath = path.join(__dirname, '../../../server/templates/website-not-found.html');
              var errorPage = fs.readFileSync(errorPagePath, 'utf8');

              res.statusCode.should.eql(404);
              res.text.should.eql(errorPage);

              resolve();

            } else {
              reject(new Error('error expected'));
            }
          });
      });

    });
  });

});
