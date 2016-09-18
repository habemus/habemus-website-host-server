// native
const util = require('util');

// third-party
const HWorkerServer = require('h-worker/server');

function WebsiteDeployWorker(options) {
  HWorkerServer.call(this, options);
}
util.inherits(WebsiteDeployWorker, HWorkerServer);

WebsiteDeployWorker.prototype.taskName = 'website-deploy';

WebsiteDeployWorker.prototype.workerFn = function (data, logger) {

};

module.exports = WebsiteDeployWorker;
