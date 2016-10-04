// third-party
const amqplib  = require('amqplib');
const Bluebird = require('bluebird');

module.exports = function (app, options) {

  const RABBIT_MQ_URI = options.rabbitMQURI;

  var rabbitMQSvc = {};

  return Bluebird.resolve(amqplib.connect(RABBIT_MQ_URI))
    .then((connection) => {

      rabbitMQSvc.connection = connection;

      return rabbitMQSvc;
    });
};
