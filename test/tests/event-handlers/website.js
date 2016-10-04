const fs   = require('fs');
const path = require('path');
const url  = require('url');

const should   = require('should');
const Bluebird = require('bluebird');
const amqplib  = require('amqplib');

// load zip-util before mocking it
const zipUtil  = require('zip-util');

// auxiliary
const aux = require('../../aux');

describe('website events', function () {

  var ASSETS;

  beforeEach(function () {

    const createWebsiteServer = require('../../../server');
    
    return aux.setup()
      .then((assets) => {

        ASSETS = assets;

        var options = ASSETS.options = aux.genOptions();

        // create the website server application
        ASSETS.websiteServerApp = createWebsiteServer(options);

        return Bluebird.all([
          ASSETS.websiteServerApp.ready,
          amqplib.connect(options.rabbitMQURI).then((conn) => {
            return conn.createChannel();
          })
          .then((channel) => {
            ASSETS.rabbitMQChannel = channel;
          }),
        ]);
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });

  });

  afterEach(function () {
    return aux.teardown();
  });

  describe('website.updated', function () {

    it('should update a website if it is at the server', function (done) {

      this.timeout(5000);

      var websiteV1 = {
        _id: 'some-website-id',
        code: 'some-website-code',
        billingStatus: {
          value: 'disabled',
          reason: 'TestFailureReason',
        },
        activeDomainRecords: [],
        signedURL: 'http://localhost:9000/files/website-1.com.zip',
      }

      var websiteV2 = {
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
        signedURL: 'http://localhost:9000/files/website-1.com.zip',
      };

      // load the v1 of the website into place
      ASSETS.websiteServerApp.controllers.website.setupServers(websiteV1)
        .then(() => {

          // publish an update
          var payload = {
            website: websiteV2,
          };

          ASSETS.rabbitMQChannel.publish(
            ASSETS.options.websiteEventsExchange,
            'website.updated',
            new Buffer(JSON.stringify(payload)),
            {
              contentType: 'application/json',
            }
          );

          setTimeout(function () {

            // check that the website is in place
            ASSETS.websiteServerApp.controllers.website.areServersReady(websiteV2)
              .then((ready) => {
                ready.should.eql(true);
                
                done();
              })

          }, 4000);
        });

    });
  
    it('should ignore updates of websites that have not been loaded onto the server', function (done) {

      this.timeout(5000);

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

      // publish an update
      var payload = {
        website: website,
      };

      ASSETS.rabbitMQChannel.publish(
        ASSETS.options.websiteEventsExchange,
        'website.updated',
        new Buffer(JSON.stringify(payload)),
        {
          contentType: 'application/json',
        }
      );

      setTimeout(function () {

        // check that the website is in place
        ASSETS.websiteServerApp.controllers.website.areServersReady(website)
          .then((ready) => {
            ready.should.eql(false);
            
            done();
          })

      }, 4000);

    });
  });
  
  describe('website.deleted', function () {
    it('should ensure the website has been deleted from the server', function (done) {
      this.timeout(5000);

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

      // load the website into place
      ASSETS.websiteServerApp.controllers.website.setupServers(website)
        .then(() => {
          return ASSETS.websiteServerApp.controllers.website.isStorageReady(website)
            .then((ready) => {
              ready.should.eql(true);

              return;
            })
        })
        .then(() => {

          // publish a deletion
          var payload = {
            website: website,
          };

          ASSETS.rabbitMQChannel.publish(
            ASSETS.options.websiteEventsExchange,
            'website.deleted',
            new Buffer(JSON.stringify(payload)),
            {
              contentType: 'application/json',
            }
          );

          setTimeout(function () {

            // check that the website has been removed
            ASSETS.websiteServerApp.controllers.website.isWebsiteInServer(website)
              .then((isInServer) => {
                isInServer.should.eql(false);
                
                done();
              })

          }, 4000);
        })
    });

    it('should be idempotent in case the website is NOT on the server', function (done) {
      this.timeout(5000);

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

      // publish a deletion
      var payload = {
        website: website,
      };

      ASSETS.rabbitMQChannel.publish(
        ASSETS.options.websiteEventsExchange,
        'website.deleted',
        new Buffer(JSON.stringify(payload)),
        {
          contentType: 'application/json',
        }
      );

      setTimeout(function () {

        // check that the website has been removed
        ASSETS.websiteServerApp.controllers.website.isWebsiteInServer(website)
          .then((isInServer) => {
            isInServer.should.eql(false);
            
            done();
          })

      }, 4000);
    });
  });

  describe('website.created', function () {
    it('should setup the website', function (done) {
      this.timeout(5000);

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

      // publish a deletion
      var payload = {
        website: website,
      };

      ASSETS.rabbitMQChannel.publish(
        ASSETS.options.websiteEventsExchange,
        'website.created',
        new Buffer(JSON.stringify(payload)),
        {
          contentType: 'application/json',
        }
      );

      setTimeout(function () {

        // check that the website has been removed
        ASSETS.websiteServerApp.controllers.website.areServersReady(website)
          .then((ready) => {
            ready.should.eql(true);
            
            done();
          })

      }, 4000);
    });
  });

});
