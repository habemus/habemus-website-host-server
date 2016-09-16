// third-party
const Bluebird = require('bluebird');

module.exports = function (app, options) {

  var setupManager = {};

  /**
   * Array of promise descriptors of file loading operations
   * 
   * @type {Array}
   */
  var _loadingPromiseDescriptors = [];

  function _findLoadingPromise(website) {
    var descriptor = _loadingPromiseDescriptors.find((descriptor) => {
      return descriptor.websiteId === website._id;
    });

    return descriptor ? descriptor.promise : null;
  }

  function _registerLoadingPromise(website, promise) {
    _loadingPromiseDescriptors.push({
      websiteId: website._id,
      promise: promise,
    });
  }

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
  setupManager.ensureReady = function (website) {

    var promise = _findLoadingPromise(website);

    if (!promise) {

      promise = app.controllers.website.areServersReady(website)
        .then((serversReady) => {
          if (!serversReady) {
            return app.controllers.website.setupServers(website);
          }
        });

      _registerLoadingPromise(website, promise);

    }

    return promise;

  };

  return setupManager;
};
