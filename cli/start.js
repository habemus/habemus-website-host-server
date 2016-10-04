// native
const http = require('http');

// internal dependencies
const pkg = require('../package.json');

// internal dependencies
const hWebsiteServer = require('../server');

var options = {
  port: process.env.PORT,
  apiVersion: pkg.version,

  rabbitMQURI: process.env.RABBIT_MQ_URI,

  hWebsiteURI: process.env.H_WEBSITE_URI,
  hWebsiteToken: process.env.H_WEBSITE_TOKEN,

  websitesStorageFsRoot: process.env.WEBSITES_STORAGE_FS_ROOT,
  websitesServerFsRoot: process.env.WEBSITES_SERVER_FS_ROOT,

  hostDomain: process.env.HOST_DOMAIN,
};

// instantiate the app
var app = hWebsiteServer(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('hWebsiteServer listening at port %s', options.port);
});
