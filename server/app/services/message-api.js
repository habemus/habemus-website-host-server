// third-party dependencies
const jsonMessage = require('json-message');

module.exports = function (app, options) {

  const json = jsonMessage(options.apiVersion);

  var messageAPI = {
    item: function (sourceData, dataMap) {
      var msg = json.response.item();

      msg.load(sourceData, dataMap);

      return msg;
    },

    list: function (sourceData, dataMap) {
      var msg = json.response.list();

      msg.load(sourceData, dataMap);

      return msg;
    },

    error: function (sourceData, dataMap) {
      var msg = json.response.error();

      if (sourceData) {
        msg.load(sourceData, dataMap);
      }

      return msg;
    }
  };

  // make the service available to the application
  app.services.messageAPI = messageAPI;

  return messageAPI;
};