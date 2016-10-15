// native
const fs = require('fs');

// third-party dependencies
const Bluebird = require('bluebird');
const zipUtil  = require('zip-util');
const rimraf   = require('rimraf');
const cpr      = require('cpr');
const rootPathBuilder = require('root-path-builder');

// own
const badgeify = require('../lib/badgeify');

// promisify
Bluebird.promisifyAll(fs);
const rimrafAsync = Bluebird.promisify(rimraf);
const cprAsync    = Bluebird.promisify(cpr);

// constants
const CONSTANTS = require('../../shared/constants');

module.exports = function (app, options) {

  const errors = app.errors;
  const HOST_DOMAIN = options.hostDomain;
  const H_WEBSITE_MANAGER_PRIVATE_AUTH_TOKEN = options.hWebsiteManagerPrivateAuthToken;

  const WEBSITES_STORAGE_FS_ROOT = options.websitesStorageFsRoot;
  const WEBSITES_SERVER_FS_ROOT = options.websitesServerFsRoot;

  /**
   * Root path builders
   */
  const storageSrcRoot = rootPathBuilder(WEBSITES_STORAGE_FS_ROOT + '/src');
  const storageBadgedRoot = rootPathBuilder(WEBSITES_STORAGE_FS_ROOT + '/badged');
  const serverRoot = rootPathBuilder(WEBSITES_SERVER_FS_ROOT);

  var websiteCtrl = {};

  websiteCtrl.unlinkStorage = function (website) {

    var srcDirPath = storageSrcRoot.prependTo(website._id);
    var badgedDirPath = storageBadgedRoot.prependTo(website._id);

    return Bluebird.all([
      rimrafAsync(badgedDirPath),
      rimrafAsync(srcDirPath),
    ])
    .then(() => {
      return;
    });
  };

  websiteCtrl.unlinkServers = function (website) {

    if (!website) {
      return Bluebird.reject(new errors.InvalidOption('website', 'required'));
    }

    /**
     * List of domains that the website has.
     * Starts with the combination of website.code + hostdomain
     * @type {Array}
     */
    var domains = [website.code + '.' + HOST_DOMAIN];
    var activeDomainRecords = website.activeDomainRecords || [];

    activeDomainRecords.forEach((record) => {
      domains.push(record.domain);

      if (record.enableWwwAlias) {
        domains.push('www.' + record.domain);
      }
    });

    return Bluebird.all(domains.map((domain) => {

      var serverSymlinkPath = serverRoot.prependTo(domain);

      return fs.unlinkAsync(serverSymlinkPath);
    }))
    .then(() => {
      return;
    })
    .catch((err) => {

      if (err.code === 'ENOENT') {
        // the link did not exist anyway
        return;
      } else {
        return Bluebird.reject(err);
      }
    });
  };

  /**
   * Proxy method that verifies if the server handles
   * the given website.
   * 
   * @param  {Object}  website
   * @return {Bluebird -> Boolean}
   */
  websiteCtrl.isWebsiteInServer = function (website) {
    return websiteCtrl.isStorageReady(website);
  };

  /**
   * Checks whether the files are in storage
   * takes into account that websites may need the badged version
   * depending on their billing statuses
   * 
   * @param  {Object}  website
   * @return {Boolean}
   */
  websiteCtrl.isStorageReady = function (website) {

    if (!website) {
      return Bluebird.reject(new errors.InvalidOption('website', 'required'));
    }

    var srcDirPath = storageSrcRoot.prependTo(website._id);
    var badgedDirPath = storageBadgedRoot.prependTo(website._id);

    // list of checks that need to be performed
    var checks = [];
    // src dir check is always required
    checks.push(fs.lstatAsync(srcDirPath));

    // whether the website is a free website or has the billing
    // in pending mode
    var useBadgedVersion = website.billingStatus.value !== 'enabled';

    if (useBadgedVersion) {
      checks.push(fs.lstatAsync(badgedDirPath));
    }

    return Bluebird.all(checks)
      .then((results) => {
        return results.every((stat) => {
          return stat.isDirectory();
        });
      })
      .catch((err) => {
        // TODO: check error type
        return false;

      });

  };

  /**
   * Checks whether the servers files are in place
   * 
   * @param  {Object} website
   * @return {Bluebird -> Boolean}
   */
  websiteCtrl.areServersReady = function (website) {

    if (!website || !website.activeDomainRecords) {
      return Bluebird.reject(new errors.InvalidOption('website', 'required'));
    }

    /**
     * Subdomain of the given website depends on whether the
     * website has a specified versionCode
     */
    var subdomainDirPath;

    if (website.versionCode) {
      subdomainDirPath = serverRoot.prependTo(
        website.versionCode + '.' + website.code + '.' + HOST_DOMAIN);
    } else {
      subdomainDirPath = serverRoot.prependTo(website.code + '.' + HOST_DOMAIN);
    }
    
    var customDomainDirPaths = website.activeDomainRecords.reduce((res, record) => {
      res.push(serverRoot.prependTo(record.domain));

      if (record.enableWwwAlias) {
        res.push(serverRoot.prependTo('www.' + record.domain));
      }

      return res;
    }, []);

    var _allDomainsDirPaths = customDomainDirPaths.concat([subdomainDirPath]);

    return Bluebird.all(_allDomainsDirPaths.map((domainDirPath) => {

      return fs.lstatAsync(domainDirPath);

    }))
    .then((stats) => {
      return stats.every((stat) => {
        return stat.isSymbolicLink();
      });
    })
    .catch((err) => {
      if (err.code === 'ENOENT') {
        return false;
      } else {
        return Bluebird.reject(err);
      }
    });
  };

  /**
   * Runs the full process of loading the website's files into
   * src storage and compiling the badged storage (if necessary).
   * 
   * @param  {Object} website
   * @return {Bluebird}
   */
  websiteCtrl.setupStorage = function (website) {
    if (!website || !website._id || !website.signedURL) {
      return Bluebird.reject(new errors.InvalidOption('website', 'required'));
    }

    var srcDirPath    = storageSrcRoot.prependTo(website._id);
    var badgedDirPath = storageBadgedRoot.prependTo(website._id);

    // whether the website is a free website or has the billing
    // in pending mode
    var useBadgedVersion = website.billingStatus.value !== 'enabled';

    // first clear up paths requried for the storage
    return websiteCtrl.unlinkStorage(website)
      .then(() => {
        // load the files into the srcStorage (untransformed files)
        return zipUtil.zipDownload(website.signedURL, srcDirPath)
      })
      .then(() => {

        if (useBadgedVersion) {

          // copy the files into the badgedDir
          return cprAsync(srcDirPath, badgedDirPath, {
            deleteFirst: true,
            overwrite: true,
            confirm: true,
          })
          .then((copiedFiles) => {
            return badgeify(badgedDirPath);
          });

        } else {
          return;
        }

      });
  };

  /**
   * Ensures storages are ready and sets up the symlinking.
   * Takes into account the website's billing status
   * 
   * @param  {Object} website
   * @return {Bluebird -> undefined}
   */
  websiteCtrl.setupServers = function (website) {
    if (!website || !website._id ||
        !website.activeDomainRecords || !website.code) {
      return Bluebird.reject(new errors.InvalidOption('website', 'required'));
    }

    var srcDirPath    = storageSrcRoot.prependTo(website._id);
    var badgedDirPath = storageBadgedRoot.prependTo(website._id);

    // whether the website is a free website or has the billing
    // in pending mode
    var useBadgedVersion = website.billingStatus.value !== 'enabled';

    return websiteCtrl.isStorageReady(website)
      .then((isLoaded) => {
        if (!isLoaded) {
          return websiteCtrl.unlinkStorage(website).then(() => {
            return websiteCtrl.setupStorage(website);
          });
        }
      })
      .then(() => {

        // remove remaining symlinks
        return websiteCtrl.unlinkServers(website);
      })
      .then(() => {

        // link the 'subdomain-server' to the source version of the website
        // the subdomain depends on whether the website has a specific versionCode
        // or not
        var subdomainDirPath;

        if (website.versionCode) {
          subdomainDirPath = serverRoot.prependTo(
            website.versionCode + '.' + website.code + '.' + HOST_DOMAIN);
        } else {
          subdomainDirPath = serverRoot.prependTo(website.code + '.' + HOST_DOMAIN);
        }
        var subdomainServerPromise = fs.symlinkAsync(srcDirPath, subdomainDirPath, 'dir');

        // make the active domain records to the correct version (badged or unbadged)
        var customDomainStoragePath = useBadgedVersion ? badgedDirPath : srcDirPath;
        var customDomainServerPromises = website.activeDomainRecords.map((record) => {
          var domainDirPath    = serverRoot.prependTo(record.domain);
          var domainWWWDirPath = serverRoot.prependTo('www.' + record.domain);

          return Bluebird.all([
            fs.symlinkAsync(customDomainStoragePath, domainDirPath, 'dir'),
            // if the `enableWwwAlias` is set to true,
            // create the 'www' server as well
            record.enableWwwAlias ? fs.symlinkAsync(customDomainStoragePath, domainWWWDirPath, 'dir') : undefined,
          ]);
        });

        return Bluebird.all(customDomainServerPromises.concat([subdomainServerPromise]));
      })
      .then((results) => {
        return;
      });
  };

  return websiteCtrl;
};
