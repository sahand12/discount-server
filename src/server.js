// # Boot up
// This file needs serious love & refactoring

/**
 * make sure overrides get's called first
 * - keeping the overrides require here works for installing offpash as npm!
 *
 * the call order is the following:
 * - root index requires src module
 * - src index requires server
 * - overrides is the first package to load
 */
require('./overrides');

// Module dependencies
const debug = require('debug')('boot:init');

// config should be the first require, as it triggers the initial load of the config files
const config = require('./config');
const Promise = require('bluebird');
const logging = require('./logging');
const i18n = require('./i18n');
const models = require('./models');
const permissions = require('./permissions');
const auth = require('./auth');
const dbHealth = require('./data/db/health');
const OffpashServer = require('./offpash-server');
const settings = require('./settings');
const settingsCache = require('./settings/cache');
const utils = require('./utils');

// ## Initialise Offpash
function init() {
  debug('Init Start ...');
  
  let offpashServer;
  let parentApp;
  
  // Initialize
  i18n.start();
  debug('I18n done');
  models.init();
  debug('models done');
  
  return dbHealth.check().then(() => {
    debug('DB health check done');
    // Populate any missing default settings
    // Refresh the API settings cache
    return settings.init();
  }).then(() => {
    debug('Update settings cache done');
    
    // Initialise the permissions actions and objects
    return permissions.init();
  }).then(() => {
    debug('Permissions done');
    
    // Setup our collection of express apps
    parentApp = require('./app')();
    
    // Initialise analytics events
    if (config.get('segment:key')) {
      require('./analytics-events').init();
    }
    
    debug('Express Apps done');
  }).then(() => {
    return auth.validation.validate({
      authType: config.get('auth:type')
    });
  }).then(() => {
    // runs asynchronous
    auth.init({
      authType: config.get('auth:type'),
      offpashAuthUrl: config.get('auth:url'),
      redirectUri: utils.url.urlFor('admin', true),
      clientUri: utils.url.urlFor('home', true),
      clientName: settingsCache.get('title'),
      clientDescription: settingsCache.get('description')
    })
      .then(response => parentApp.use(response.auth))
      .catch(function onAuthError(err) {
        logging.error(err);
      });
  }).then(() => {
    debug('Auth done');
    return new OffpashServer(parentApp);
  }).then(_offpashServer => {
    offpashServer = _offpashServer;
    
    // debug('Server done');;
    return offpashServer;
  });
}

module.exports = init;
