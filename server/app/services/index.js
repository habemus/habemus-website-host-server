// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {
  
  // instantiate services
  app.services = {};
  
  return Bluebird.all([
    require('./logging')(app, options),
    require('./message-api')(app, options),
    require('./redis')(app, options),
    require('./h-website-manager-private')(app, options),
  ])
  .then((services) => {

    app.services.logging = services[0];
    app.services.messageAPI = services[1];
    app.services.redis = services[2];
    app.services.hwm = services[3];

    return;
  });
};