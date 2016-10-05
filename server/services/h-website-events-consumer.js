// third-party
const HMQEventsConsumer = require('h-mq-events/consumer');

module.exports = function (app, options) {

  var hWebsiteEventsConsumer = new HMQEventsConsumer({
    name: 'website-events',
    events: ['created', 'updated', 'deleted']
  });
  
  return hWebsiteEventsConsumer.connect(app.services.rabbitMQ.connection)
    .then(() => {
      return hWebsiteEventsConsumer;
    });
};
