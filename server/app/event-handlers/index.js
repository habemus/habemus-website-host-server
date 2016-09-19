// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {

  return Bluebird.all([
    require('./website-updated')(app, options),
    require('./website-created')(app, options),
    require('./website-deleted')(app, options),
  ])
  .then(() => {
    // ensure nothing is returned
    return;
  });
};
