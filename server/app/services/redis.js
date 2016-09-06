const redis    = require('redis');
const Bluebird = require('bluebird');

Bluebird.promisifyAll(redis.RedisClient.prototype);
Bluebird.promisifyAll(redis.Multi.prototype);

module.exports = function (app, options) {

  var redisService = {};
  
  return new Bluebird((resolve, reject) => {
    var redisClient = redis.createClient(options.redisURI);

    redisService.client = redisClient;
    
    redisClient.once('ready', _resolve);
    redisClient.once('error', _reject);

    function off () {
      redisClient.removeListener('ready', resolve);
      redisClient.removeListener('error', _reject);
    }

    function _resolve () {
      off();
      resolve();
    }

    function _reject (err) {
      off();
      reject(err);
    }
  })
  .then(() => {
    // TODO: handle afterward errors
    return redisService;
  });
};
