// third-party
const Bluebird = require('bluebird');
const bunyan   = require('bunyan');

module.exports = function (app, options) {

  return bunyan.createLogger({
    name: 'h-website-server',
  });
};
