const nconf = require('nconf');
const fs = require('fs');
const {join} = require('path');
let config;

const setupConfig = function setupConfig() {
  const env = require('./env');
  let defaults = {};
  const parentPath = process.cwd();
  const config = new nconf.Provider();
  
  if (parentPath && fs.existsSync(join(parentPath, 'config.example.json'))) {
    defaults = require(join(parentPath, 'config.example.json'));
  }
  
  config.argv() // Setup nconf to use (in-order) 1. Command-line arguments
    .env() // 2. Environment variables
    .file({ // 3. A file located at the given path
      file: join(parentPath, `config.${env}.json`)
    });
  
  config.set('env', env);
  config.defaults(defaults); // 4. The defaults
  
  return config;
};

module.exports = function initConfig() {
  if (!config) {
    config = setupConfig();
  }
  
  return config;
};
