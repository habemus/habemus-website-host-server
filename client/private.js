// native
const util = require('util');
const EventEmitter = require('events').EventEmitter;

// third-party
const Bluebird = require('bluebird');
const amqplib  = require('amqplib');

function _validateWebsite(website) {

  if (!website) {
    return Bluebird.reject(new errors.InvalidOption('website', 'required'));
  }

  if (!website._id) {
    return Bluebird.reject(new errors.InvalidOption('website._id', 'required'));
  }

  if (!website.code) {
    return Bluebird.reject(new errors.InvalidOption('website.code', 'required'));
  }

  if (!website.readSignedURL) {
    return Bluebird.reject(new errors.InvalidOption('website.readSignedURL', 'required'));
  }

  if (!website.billingStatus || !website.billingStatus.value) {
    return Bluebird.reject(new errors.InvalidOption('website.billingStatus', 'invalid'));
  }

  if (!website.activeDomainRecords) {
    return Bluebird.reject(new errors.InvalidOption('website.activeDomainRecords', 'required'));
  }
}

/**
 * Private client constructor
 * 
 * @param {Object} options
 */
function PrivateHWebsiteServerClient(options) {

  if (!options.websiteEventsExchange) {
    throw new Error('websiteEventsExchange is required');
  }

  this.websiteEventsExchange = options.websiteEventsExchange;
}
util.inherits(PrivateHWebsiteServerClient, EventEmitter);

/**
 * Connects to the rabbitMQ server instance and sets up the topology
 * required
 * 
 * @param  {String | Object} connectionOrURI
 * @return {PrivateHWebsiteServerClient}
 */
PrivateHWebsiteServerClient.prototype.connectRabbitMQ = function (connectionOrURI) {

  if (!connectionOrURI) {
    return Bluebird.reject(new errors.InvalidOption('connectionOrURI', 'required'));
  }

  var websiteEventsExchange = this.websiteEventsExchange;

  var _channel;

  // check the type of the connection and act accordingly
  var connectionPromise = (typeof connectionOrURI === 'string') ?
    Bluebird.resolve(amqplib.connect(connectionOrURI)) :
    Bluebird.resolve(connectionOrURI);

  // wait for connection to be ready
  return connectionPromise.then((connection) => {

    this.connection = connection;

    return connection.createChannel();
  })
  .then((channel) => {
    _channel = channel;

    return Bluebird.all([
      /**
       * Exchange for events
       */
      channel.assertExchange(websiteEventsExchange, 'topic'),
    ]);
  })
  .then(() => {
    this.channel = _channel;

    return this;
  });

};

PrivateHWebsiteServerClient.prototype.publishWebsiteCreated = function (website) {

  var validationError = _validateWebsite(website);

  if (validationError) {
    return validationError;
  }

  return this._publishEvent('website.created', {
    website: website,
  });
};

PrivateHWebsiteServerClient.prototype.publishWebsiteUpdated = function () {
  var validationError = _validateWebsite(website);

  if (validationError) {
    return validationError;
  }

  return this._publishEvent('website.updated', {
    website: website,
  });
};

PrivateHWebsiteServerClient.prototype.publishWebsiteDeleted = function () {
  var validationError = _validateWebsite(website);

  if (validationError) {
    return validationError;
  }

  return this._publishEvent('website.deleted', {
    website: website,
  });
};


/**
 * Private method responsible for communicating with the
 * rabbitMQ server
 * 
 * @param  {*} data
 * @param  {Object} options      
 */
PrivateHWebsiteServerClient.prototype._publishEvent = function (routingKey, content) {

  if (!routingKey) {
    return Bluebird.reject(new errors.InvalidOption('routingKey', 'required'));
  }

  if (!content) {
    return Bluebird.reject(new errors.InvalidOption('content', 'required'));
  }

  var websiteEventsExchange = this.websiteEventsExchange;

  var contentType = 'application/json';

  // set default options for publishing
  options = {
    timestamp: Date.now(),
    contentType: 'application/json',
  };

  return this.channel.publish(
    this.websiteEventsExchange,
    routingKey,
    content,
    options
  );
};

module.exports = PrivateHWebsiteServerClient;
