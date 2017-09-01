const omit = require('lodash/omit');
const _private = {};

_private.serialize = function serialize(err) {
  try {
    return {
      id: err.id,
      status: err.statusCode,
      code: err.code || err.errorType,
      title: err.name,
      detail: err.message,
      meta: {
        context: err.context,
        help: err.help,
        errorDetails: err.errorDetails,
        level: err.level,
        errorType: err.errorType
      }
    };
  }
  catch (err) {
    return {
      detail: 'Something went wrong'
    };
  }
};

_private.deserialze = function deserialize(obj) {
  try {
    return {
      id: obj.id,
      message: obj.detail || obj['error_description'] || obj.message,
      statusCode: obj.status,
      code: obj.code || obj.error,
      level: obj.meta && obj.meta.level,
      help: obj.meta && obj.meta.help,
      context: obj.meta && obj.meta.context
    };
  }
  catch (err) {
    return {
      message: 'Something went wrong'
    };
  }
};

/**
 * https://tools.ietf.org/html/rfc6749#page-45
 *
 * To not lose any error data when sending errors between internal services, we use the suggested
 * OAuth properties and ours as well.
 */
_private.oAuthSerialize = function oAuthSerialize(err) {
  const matchTable = {};
  
  matchTable[this.NoPermissionError.name] = 'access_denied';
  matchTable[this.MaintenanceError.name] = 'temporarily_unavailable';
  matchTable[this.BadRequestError.name] = matchTable[this.ValidationError.name] = 'invalid_request';
  matchTable['default'] = 'server_error';
  
  return Object.assign({
    error: err.code || matchTable[err.name] || 'server_error',
    'error_description': err.message
  }, omit(_private.serialize(err), ['detail', 'code']));
};

_private.oAuthDeserialize = function oAuthDeserialize (errorFormat) {
  try {
    return new this[errorFormat.title || errorFormat.name || this.InternalServerError.name](_private.deserialze(errorFormat));
  }
  catch (err) {
    // CASE: you receive an OAuth formatted error, but the error prototype is unknown
    return new this.InternalServerError(Object.assign(
      {errorType: errorFormat.title || errorFormat.name},
      _private.deserialze(errorFormat)
    ));
  }
};

_private.jsonApiSerialize = function jsonApiSerialize(err) {
  const errorFormat = {
    errors: [_private.serialize(err)]
  };
  
  errorFormat.errors[0].source = {};
  if (err.property) {
    errorFormat.errors[0].source.pointer = `/data/attributes/${err.property}`;
  }
  
  return errorFormat;
};

_private.jsonApiDeserialize = function jsonApiDeserialize(errorFormat) {
  errorFormat = errorFormat.errors && errorFormat.errors[0] || {};
  let internalError;
  
  try {
    internalError = new this[errorFormat.title || errorFormat.name || this.InternalServerError.name](_private.deserialze(errorFormat));
  }
  catch (err) {
    // CASE: you receive a JSON format error, but the error prototype is unknown
    internalError = new this.InternalServerError(Object.assign(
      {errorType: errorFormat.title || errorFormat.name},
      _private.deserialze(errorFormat)
    ));
  }
  
  if (errorFormat.source && errorFormat.source.pointer) {
    internalError.property = errorFormat.source.pointer.split('/')[3];
  }
  
  return internalError;
};

/**
 * http://jsonapi.org/format/#errors
 *
 * options:
 *   format: jsonapi || oauth
 */
exports.serialize = function serialize(err, options = {format: 'jsonapi'}) {
  let errorFormat = {};
  
  try {
    if (options.format === 'jsonapi') {
      errorFormat = _private.jsonApiSerialize.bind(this)(err);
    }
    else {
      errorFormat = _private.oAuthSerialize.bind(this)(err);
    }
  }
  catch (err) {
    errorFormat.message = 'Something went wrong.';
  }
  
  // no need to sanitize the undefined values. on response send JSON.stringify get's called
  return errorFormat;
};

/**
 * deserialize from error format to internal error instance
 */
exports.deserialize = function deserialize (errorFormat) {
  let internalError = {};
  
  if (errorFormat.errors) {
    internalError = _private.jsonApiDeserialize.bind(this)(errorFormat);
  }
  else {
    internalError = _private.oAuthDeserialize.bind(this)(errorFormat);
  }
  
  return internalError;
};

/**
 * instanceof mostly fails. if multiple sub dependencies use it's own ignition installation
 */
exports.isIgnitionError = function isIgnitionError(err) {
  let IgnitionName = this.IgnitionError.name;
  
  const recursiveIsIgnitionError = function recursiveIsIgnitionError(obj) {
    // no super constructor available anymore
    if (!obj) {
      return false;
    }
    
    if (obj.name === IgnitionName) {
      return true;
    }
    
    return recursiveIsIgnitionError(obj.super_);
  };
  
  return recursiveIsIgnitionError(err.constructor);
};
