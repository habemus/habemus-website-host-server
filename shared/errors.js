// native
const util = require('util');

/**
 * Base error constructor
 * @param {String} message
 */
function HWebsiteServerError(message) {
  Error.call(this);
  
  this.message = message;
};
util.inherits(HWebsiteServerError, Error);
HWebsiteServerError.prototype.name = 'HWebsiteServerError';
exports.HWebsiteServerError = HWebsiteServerError;

/**
 * Happens when any required option is invalid
 *
 * error.option should have the option that is invalid
 * error.kind should contain details on the error type
 * 
 * @param {String} option
 * @param {String} kind
 * @param {String} message
 */
function InvalidOption(option, kind, message) {
  this.option = option;
  this.kind = kind;

  message = message || option + ' ' + kind;

  HWebsiteServerError.call(this, message);
}
util.inherits(InvalidOption, HWebsiteServerError);
InvalidOption.prototype.name = 'InvalidOption';
exports.InvalidOption = InvalidOption;

/**
 * Happens whenever an action requested is not authorized
 * by the server
 * @param {String} message
 */
function Unauthorized(message) {
  HWebsiteServerError.call(this, message);
}
util.inherits(Unauthorized, HWebsiteServerError);
Unauthorized.prototype.name = 'Unauthorized';

/**
 * Happens whenever the token provided for auth is invalid
 */
function InvalidToken() {
  HWebsiteServerError.call(this, 'Token provided is invalid');
}
util.inherits(InvalidToken, HWebsiteServerError);
InvalidToken.prototype.name = 'InvalidToken';

/**
 * Happens whenever an entity is not found in the database
 */
function NotFound(resource, resourceId) {
  HWebsiteServerError.call(this, 'item not found');
  
  this.resource = resource;
  this.resourceId = resourceId;
}
util.inherits(NotFound, HWebsiteServerError);
NotFound.prototype.name = 'NotFound';

/**
 * Happens whenever the whole website is not found.
 */
function WebsiteNotFound(websiteIdentifier) {
  HWebsiteServerError.call(this, 'website not found');

  this.resourceId = websiteIdentifier;
}
util.inherits(WebsiteNotFound, HWebsiteServerError);
WebsiteNotFound.prototype.name = 'WebsiteNotFound';

exports.Unauthorized = Unauthorized;
exports.InvalidToken = InvalidToken;
exports.NotFound = NotFound;
exports.WebsiteNotFound = WebsiteNotFound;
