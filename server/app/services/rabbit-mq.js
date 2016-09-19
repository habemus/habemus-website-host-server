// third-party
const amqplib  = require('amqplib');
const Bluebird = require('bluebird');

const EVENT_QUEUE_OPTIONS = {
  exclusive: true,
  durable: false,
  autoDelete: true,
};

module.exports = function (app, options) {

  const RABBIT_MQ_URI = options.rabbitMQURI;

  /**
   * The exchange's name MUST be the same used in h-website-manager
   * @type {String}
   */
  const EXCHANGE_NAME = options.websiteEventsExchange;

  /**
   * Routing keys
   * @type {String}
   */
  const UPDATED_RK = 'website.updated';
  const CREATED_RK = 'website.created';
  const DELETED_RK = 'website.deleted';

  /**
   * Queue names
   * @type {String}
   */
  const UPDATED_QUEUE = 'website-updated-' + app.id;
  const CREATED_QUEUE = 'website-created-' + app.id;
  const DELETED_QUEUE = 'website-deleted-' + app.id;

  /**
   * Rabbit mq service object.
   * All artifacts related to the service are exposed here.
   * 
   * @type {Object}
   */
  var rabbitMQSvc = {
    websiteEventQueues: {
      updated: UPDATED_QUEUE,
      created: CREATED_QUEUE,
      deleted: DELETED_QUEUE
    }
  };

  return Bluebird.resolve(amqplib.connect(RABBIT_MQ_URI))
    .then((connection) => {

      rabbitMQSvc.connection = connection;

      return connection.createChannel();
    })
    .then((channel) => {
      rabbitMQSvc.channel = channel;

      return Bluebird.all([
        /**
         * Use topic exchange
         */
        channel.assertExchange(EXCHANGE_NAME, 'topic'),

        // updated queue
        channel.assertQueue(
          UPDATED_QUEUE,
          EVENT_QUEUE_OPTIONS
        ),
        channel.bindQueue(
          UPDATED_QUEUE,
          EXCHANGE_NAME,
          UPDATED_RK
        ),

        // created queue
        channel.assertQueue(
          CREATED_QUEUE,
          EVENT_QUEUE_OPTIONS
        ),
        channel.bindQueue(
          CREATED_QUEUE,
          EXCHANGE_NAME,
          CREATED_RK
        ),

        // deleted queue
        channel.assertQueue(
          DELETED_QUEUE,
          EVENT_QUEUE_OPTIONS
        ),
        channel.bindQueue(
          DELETED_QUEUE,
          EXCHANGE_NAME,
          CREATED_RK
        )
      ])
    })
    .then(() => {
      // return the service object at the end
      return rabbitMQSvc;
    });

};
