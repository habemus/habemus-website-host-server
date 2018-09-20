// third-party
const AMQPEventsConsumer = require('@habemus/amqp-events/consumer');

module.exports = function (app, options) {

  var hWebsiteEventsConsumer = new AMQPEventsConsumer({
    name: 'website-events',
    events: ['deployed', 'deleted']
  });
  
  return hWebsiteEventsConsumer.connect(app.services.rabbitMQ.connection)
    .then(() => {
      return hWebsiteEventsConsumer;
    });
};
