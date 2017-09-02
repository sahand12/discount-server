module.exports = {
  get config() {return require('./lib/config');},
  get errors() {return require('./lib/errors');},
  get server() {return require('./lib/server');},
  get logging() {return require('./lib/logging');}
};
