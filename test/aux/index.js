// native dependencies
const path = require('path');
const http = require('http');

// third-party dependencies
const enableDestroy = require('server-destroy');
const Bluebird = require('bluebird');
const fse = require('fs-extra');

// own deps
const fileServer = require('./file-server');

const RABBIT_MQ_URI = 'amqp://localhost';
const FIXTURES_PATH = path.join(__dirname, '../fixtures');
const TMP_PATH = path.join(__dirname, '../tmp');

const FILE_SERVER_PORT = 9000;

exports.fileServerURI = 'http://localhost:9000';
exports.fixturesPath = FIXTURES_PATH;
exports.tmpPath = TMP_PATH;

exports.defaultOptions = {
  apiVersion: '0.0.0',
  rabbitMQURI: RABBIT_MQ_URI,
  hWebsiteURI: 'http://website-manager-uri.com',
  hWebsiteToken: 'TOKEN',
  websitesStorageFsRoot: TMP_PATH + '/websites-storage',
  websitesServerFsRoot: TMP_PATH + '/websites-server',
  hostDomain: 'habemus.website',
};

/**
 * Generates an options object using
 * the passed options and adding default values to
 * empty options
 * @param  {Object} opts
 * @return {Object}
 */
exports.genOptions = function (opts) {
  return Object.assign({}, exports.defaultOptions, opts);
};

/**
 * Used to reject successful promises that should have not been fulfilled
 * @return {Bluebird Rejection}
 */
exports.errorExpected = function () {
  return Bluebird.reject(new Error('error expected'));
};

/**
 * Starts a server and keeps reference to it.
 * This reference will be used for teardown.
 */
exports.startServer = function (port, app) {

  if (!port) { throw new Error('port is required'); }
  if (!app) { throw new Error('app is required'); }

  // create http server and pass express app as callback
  var server = http.createServer();

  // make the server destroyable
  enableDestroy(server);

  server.on('request', app);

  return new Bluebird((resolve, reject) => {
    server.listen(port, () => {

      // register the server to be tore down
      exports.registerTeardown(function () {
        return new Bluebird(function (resolve, reject) {
          server.destroy((err) => {
            if (err) {

              console.warn('silent error upon destroying server on teardown', err);
              resolve();
            } else {
              resolve();
            }
          });
        })
      });

      // resolve with the server
      resolve(server);
    });
  });
};

/**
 * Sets up an assets object that is ready for the tests
 * @return {[type]} [description]
 */
exports.setup = function () {

  var _assets = {};

  fse.emptyDirSync(TMP_PATH);
  fse.emptyDirSync(TMP_PATH + '/websites-storage');
  fse.emptyDirSync(TMP_PATH + '/websites-server');

  exports.registerTeardown(function () {
    fse.emptyDirSync(TMP_PATH);
  });

  // start the file server
  return exports.startServer(FILE_SERVER_PORT, fileServer({
    filesDir: FIXTURES_PATH,
    uploadsDir: TMP_PATH,
  }))
  .then(() => {
    return _assets
  });
};

var TEARDOWN_CALLBACKS = [];

/**
 * Register a teardown function to be executed by the teardown
 * The function should return a promise
 */
exports.registerTeardown = function (teardown) {
  TEARDOWN_CALLBACKS.push(teardown);
};

/**
 * Executes all functions listed at TEARDOWN_CALLBACKS
 */
exports.teardown = function () {
  return Bluebird.all(TEARDOWN_CALLBACKS.map((fn) => {
    return fn();
  }))
  .then(() => {
    TEARDOWN_CALLBACKS = [];
  });
};

/**
 * Clones a given object
 */
exports.clone = function clone(obj) {
  var cloneObj = {};

  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      cloneObj[prop] = obj[prop];
    }
  }

  return cloneObj;
}
