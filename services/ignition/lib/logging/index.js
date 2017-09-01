const GhostLogger = require('./GhostLogger');

module.exports = function createNewInstance({domain, env, mode, level, transports, rotation, path, loggly}) {
  const adapter = new GhostLogger({
    domain,
    env,
    mode,
    level,
    transports,
    rotation,
    path,
    loggly
  });
  return adapter;
};

module.exports.GhostLogger = GhostLogger;
