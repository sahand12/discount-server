const Nconf = require('nconf');
const path = require('path');
const debug = require('debug')('ghost:config');
const localUtils = require('./utils');
const env = process.env.NODE_ENV || 'development';
const _private = {};

_private.loadNconf = function loadNconf(options = {}) {
  debug('config start');
  
  const baseConfigPath = options.baseConfigPath || __dirname;
  const customConfigPath = options.customConfigPath || process.cwd();
  const nconf = new Nconf.Provider();
  
  /**
   * no channel can override the overrides
   */
  nconf.file('overrides', path.join(baseConfigPath, 'overrides.json'));
  
  /**
   * command line arguments
   */
  nconf.argv();
  
  /**
   * env arguments
   */
  nconf.env({
    separator: '__'
  });
};
