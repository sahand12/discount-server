const config = require('./config');
const loggly = require('loggly');
const logglyClient = loggly.createClient({
  token: '1f6e03e4-4650-4723-978f-d59e9d2a362b',
  subdomain: 'nahang12',
  auth: {
    username: 'ali',
    password: 'Sahand12'
  }
});

logglyClient.log('first message', function (err, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(result);
});
//const logging = function logging(options = {}) {
//
//};
//
//module.exports = logging({
//  env: config.get('env'),
//  path: config.get('logging:path') || config.getContentPath('logs'),
//  domain: config.get('url'),
//  mode: config.get('logging:mode'),
//  level: config.get('logging:level'),
//  transports: config.get('logging:transports'),
//  loggly: config.get('logging:loggly'),
//  rotation: config.get('logging:rotation')
//});
