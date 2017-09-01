// # Server Startup
// Orchestrates the startup of Offpash when run from command line.

const startTime = Date.now();
const debug = require('debug')('boot:index');
let offpash;
let express;
let logging;
let errors;
let utils;

debug('First requires...');

offpash = require('./src');

debug('Required Offpash');

express = require('express');
logging = require('./src/logging');
errors = require('./src/errors');
utils = require('./src/utils');

debug('Initialising Offpash');
offpash().then(offpashServer => {
  
  debug('Starting Offpash');
  
  // Let Offpash handle starting our server instance.
  return offpashServer.start()
    .then(function afterStart () {
      logging.info(`Ghost boot ${(Date.now() - startTime) / 1000}s`);
      
      // If IPC messaging is enabled, ensure offpash sends message to parent process
      // on successful start
      if (process.send) {
        process.send({started: true});
      }
    });
  
}).catch(err => {
  if (!errors.utils.isIgnitionError(err)) {
    err = new errors.OffpashError({err});
  }
  
  if (process.send) {
    process.send({started: false, error: err.message});
  }
  
  logging.error(err);
  process.exit(-1);
});
