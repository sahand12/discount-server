const uuid = require('uuid');
const {inherits} = require('util');
const utils = require('./utils');

const isString = function isString (entry) {
  return Object.prototype.toString.call(entry) === '[object String]';
};

function IgnitionError(options = {}) {
  const self = this;
  
  if (isString(options)) {
    throw new Error('Please instantiate Errors with the option pattern. e.g. new errors.IgnitionError({message: "..."});');
  }
  
  Error.call(this);
  
  // Error.captureStackTrace(targetObject[, constructorOpt]) Creates a `.stack` property on
  // targetObject, which when accessed returns a string representing the location in code
  // at which Error.captureStackTrace() was called.
  // (https://nodejs.org/api/errors.html#errors_error_capturestacktrace_targetobject_constructoropt)
  Error.captureStackTrace(this, IgnitionError);
  
  /**
   * Defaults
   */
  this.statusCode = 500;
  this.errorType = 'InternalServerError';
  this.level = 'normal';
  this.message = 'The server has encountered an error.';
  this.id = uuid.v1();
  
  /**
   * Custom overrides
   */
  this.id = options.id || this.id;
  this.statusCode = options.statusCode || this.statusCode;
  this.level = options.level || this.level;
  this.context = options.context || this.context;
  this.help = options.help || this.help;
  this.errorType = options.errorType || this.errorType;
  
  this.errorDetails = options.errorDetails;
  this.code = options.code || null;
  this.property = options.property || null;
  this.redirect = options.redirect || null;
  
  this.message = options.message || this.message;
  this.hideStack = options.hideStack;
  
  // error to inherit from, override!
  // nested objects are getting copied over in one piece (can be changed, but not needed right now)
  // support err as string (it happens that third party libs return a string instead of an error instance)
  if (options.err) {
    if (isString(options.err)) {
      options.err = new Error(options.err);
    }
    
    const propsNames = ['errorType', 'name', 'statusCode', 'message', 'level'];
    Object.getOwnPropertyNames(options.err).forEach(property => {
      if (propsNames.includes(property)) {
        return;
      }
      
      if (property === 'stack') {
        self[property] += `\n\n${options.err[property]}`;
        return;
      }
      
      self[property] = options[property] || self[property];
    });
  }
  
}
inherits(IgnitionError, Error);

const errors = {
  InternalServerError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 500,
      level: 'critical',
      errorType: 'InternalServerError',
      message: 'The server has encountered an error.'
    }, options));
  },
  IncorrectUsageError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 400,
      level: 'critical',
      errorType: 'InternalUsageError',
      message: 'We detected a misuse. Please read the stack trace.'
    }, options));
  },
  NotFoundError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 404,
      errorType: 'NotFoundError',
      message: 'Resource could not be found.'
    }, options));
  },
  BadRequestError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 400,
      errorType: 'BadRequestError',
      message: 'The Request could not be understood.'
    }, options));
  },
  UnauthorizedError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 401,
      errorType: 'UnauthorizedError',
      message: 'You are not authorized to make this request.'
    }, options));
  },
  NoPermissionError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 403,
      errorType: 'NoPermission',
      message: 'You do not have permission to perform this request.'
    }, options));
  },
  ValidationError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 422,
      errorType: 'ValidationError',
      message: 'The request failed validation.'
    }, options));
  },
  UnsupportedMediaTypeError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 415,
      errorType: 'UnsupportedMediaTypeError',
      message: 'The media in the request is not supported by the server.'
    }, options));
  },
  TooManyRequestError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 429,
      errorType: 'TooManyRequestError',
      message: 'Server has received too many similar requests in a short space of time.'
    }, options));
  },
  MaintenanceError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 503,
      errorType: 'MaintenanceError',
      message: 'The server is temporarily down for maintenance'
    }, options));
  },
  MethodNotAllowedError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 405,
      errorType: 'MethodNotAllowedError',
      message: 'Method not allowed for resource.'
    }, options));
  },
  RequestEntityTooLargeError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 413,
      errorType: 'RequestEntityTooLargeError',
      message: 'Request was too big for the server to handle.'
    }, options));
  },
  TokenRevocationError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 503,
      errorType: 'TokenRevocationError',
      message: 'Token is no longer available'
    }, options));
  },
  VersionMismatchError(options) {
    IgnitionError.call(this, Object.assign({
      statusCode: 400,
      errorType: 'VersionMismatchError',
      message: 'Requested version does not match server version.'
    }, options));
  }
};

Object.keys(errors)
  .forEach(key => {
    inherits(errors[key], IgnitionError);
  });

module.exports = errors;
module.exports.IgnitionError = IgnitionError;
module.exports.utils = {
  serialize: utils.serialize.bind(errors),
  deserialize: utils.deserialize.bind(errors),
  isIgnitionError: utils.isIgnitionError.bind(errors)
};
