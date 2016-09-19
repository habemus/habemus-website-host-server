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

describe('website.updated event', function () {

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
    // return aux.teardown();
  });

  it('should work', function (done) {

    this.timeout(5000);

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

  });

});
