/**
 * The setup manager ensures that
 * the loading process for a website is not executed
 * by two (or more) processes. It merges requests
 * for loading and destroying websites
 */

// third-party
const Bluebird       = require('bluebird');
const cachePromiseFn = require('cache-promise-fn');

module.exports = function (app, options) {

  var setupManager = {};

  /**
   * Checks whether there is a load request in process.
   * If so, returns it, otherwise creates a new request
   * and registers it, so that further requests to the same website
   * are in cache.
   * 
   * @param  {Object} website [description]
   *         - _id
   *         - activeDomainRecords
   *         - billingStatus
   *           - value
   * @return {Bluebird -> undefined}
   */
  setupManager.ensureReady = cachePromiseFn(
    function (website) {
      return app.controllers.website.areServersReady(website)
        .then((serversReady) => {
          if (!serversReady) {
            return app.controllers.website.setupServers(website);
          }
        });
    }, 
    {
      cacheKey: function (website) {
        return website._id;
      }
    }
  );

  /**
   * Remvoes files and links for the website
   */
  setupManager.ensureRemoved = cachePromiseFn(
    function (website) {

      return Bluebird.all([
        app.controllers.website.unlinkServers(website),
        app.controllers.website.unlinkStorage(website),
      ])
      .then(() => {
        return;
      });
    },
    {
      cacheKey: function (website) {
        return website._id;
      }
    }
  );

  setupManager.reset = function (website) {
    return setupManager.ensureRemoved(website).then(() => {
      return setupManager.ensureReady(website);
    });
  };

  return setupManager;
};
