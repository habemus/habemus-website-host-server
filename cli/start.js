// native
const http = require('http');

// third-party
const envOptions = require('@habemus/env-options');

// internal dependencies
const hWebsiteServer = require('../server');

var options = envOptions({
  port: 'env:PORT',
  apiVersion: 'pkg:version',

  hostDomain: 'env:HOST_DOMAIN',

  rabbitMQURI: 'fs:RABBIT_MQ_URI_PATH',

  hWebsiteURI: 'env:H_WEBSITE_URI',
  hWebsiteToken: 'env:H_WEBSITE_TOKEN',

  websitesStorageFsRoot: 'env:WEBSITES_STORAGE_FS_ROOT',
  websitesServerFsRoot: 'env:WEBSITES_SERVER_FS_ROOT',
});

// instantiate the app
var app = hWebsiteServer(options);

app.ready.then(() => {
  console.log('h-website-server setup ready');
})
.catch((err) => {
  console.warn('h-website-server setup error', err);
});

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('hWebsiteServer listening at port %s', options.port);
});
