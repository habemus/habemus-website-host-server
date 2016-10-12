// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {

  return Bluebird.all([
    require('./website-deployed')(app, options),
    require('./website-deleted')(app, options),
  ])
  .then(() => {
    // ensure nothing is returned
    return;
  });
};
