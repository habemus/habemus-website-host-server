// third-party
const Bluebird = require('bluebird');
const superagent = require('superagent');

// constants
const TRAILING_SLASH_RE = /\/$/;
function WebsiteManagerPrivateClient(options) {
  if (!options.serverURI) { throw new TypeError('serverURI is required'); }

  this.serverURI = options.serverURI.replace(TRAILING_SLASH_RE, '');
}

WebsiteManagerPrivateClient.prototype.getWebsite = function (authToken, identifier, identifierProp) {

  identifierProp = identifierProp || 'activeDomain';

  var query = {};

  if (identifierProp === 'activeDomain') {
    query.byActiveDomain = true;
  } else if (identifierProp === 'code') {
    query.byCode = true;
  }

  return new Bluebird((resolve, reject) => {
    superagent
      .get(this.serverURI + '/_/website/' + identifier)
      .set('Authorization', 'Bearer ' + authToken)
      .query(query)
      .end((err, res) => {

        if (err) {
          if (res && res.body) {
            reject(res.body.error);
          } else {
            reject(err);
          }
          return;
        }

        resolve(res.body.data);

      });
  });
};

module.exports = WebsiteManagerPrivateClient;
