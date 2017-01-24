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
  websitesStorageFsRoot: 'env:WEBSITES_STORAGE_FS_ROOT',
  websitesServerFsRoot: 'env:WEBSITES_SERVER_FS_ROOT',

  rabbitMQURI: 'fs:RABBIT_MQ_URI_PATH',

  hWebsiteURI: 'env:H_WEBSITE_URI',
  hWebsiteToken: 'fs:H_WEBSITE_TOKEN_PATH',
});

// instantiate the app
var app = hWebsiteServer(options);

// create http server and pass express app as callback
var server = http.createServer(app);

app.ready.then(() => {
  console.log('h-website-server setup ready');

  // start listening
  server.listen(options.port, function () {
    console.log('h-website-server listening at port %s', options.port);
  });

  /**
   * Exit process upon rabbit mq connection close.
   * Let environment deal with reconnection.
   */
  app.services.hWebsiteEventsConsumer.on('channel-close', (e) => {
    console.warn('h-website-server hWebsiteEventsConsumer channel-close', e);
    process.exit(1);
  });

})
.catch((err) => {
  console.warn('h-website-server setup error', err);
  process.exit(1);
});
