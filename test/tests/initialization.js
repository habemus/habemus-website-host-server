const fs   = require('fs');
const path = require('path');
const url  = require('url');
const assert = require('assert');

const should   = require('should');
const Bluebird = require('bluebird');
const mockery  = require('mockery');
const fse      = require('fs-extra');
const cheerio  = require('cheerio');

// load zip-util before mocking it
const zipUtil  = require('zip-util');

// auxiliary
const aux = require('../aux');
    
const createWebsiteServer = require('../../server');

describe('server initialization', function () {

  var ASSETS;

  beforeEach(function () {

    return aux.setup()
      .catch((err) => {
        console.log(err);
        throw err;
      });

  });

  afterEach(function () {
    return aux.teardown();
  });

  it('should require apiVersion', function () {
    var opts = aux.genOptions();

    delete opts.apiVersion;

    assert.throws(function () {
      createWebsiteServer(opts);
    });
  });

  it('should require hWebsiteManagerURI', function () {
    var opts = aux.genOptions();

    delete opts.hWebsiteManagerURI;

    assert.throws(function () {
      createWebsiteServer(opts);
    });
  });

  it('should require hWebsiteManagerPrivateAuthToken', function () {
    var opts = aux.genOptions();

    delete opts.hWebsiteManagerPrivateAuthToken;

    assert.throws(function () {
      createWebsiteServer(opts);
    });
  });

  it('should require rabbitMQURI', function () {
    var opts = aux.genOptions();

    delete opts.rabbitMQURI;

    assert.throws(function () {
      createWebsiteServer(opts);
    });
  });

  it('should require websiteEventsExchange', function () {
    var opts = aux.genOptions();

    delete opts.websiteEventsExchange;

    assert.throws(function () {
      createWebsiteServer(opts);
    });
  });

  it('should require websitesStorageFsRoot', function () {
    var opts = aux.genOptions();

    delete opts.websitesStorageFsRoot;

    assert.throws(function () {
      createWebsiteServer(opts);
    });
  });

  it('should require websitesServerFsRoot', function () {
    var opts = aux.genOptions();

    delete opts.websitesServerFsRoot;

    assert.throws(function () {
      createWebsiteServer(opts);
    });
  });

  it('should require hostDomain', function () {
    var opts = aux.genOptions();

    delete opts.hostDomain;

    assert.throws(function () {
      createWebsiteServer(opts);
    });
  });
});
