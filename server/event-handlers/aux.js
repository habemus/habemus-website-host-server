/**
 * Helper function that performs some checks on the message
 * and attempts to parse its payload.
 *
 * Throws error upon unsucessful parse
 * 
 * @param  {Object} message
 *         - properties
 *         - content
 *         - fields
 * @return {Object}        
 */
exports.parseMessagePayload = function (message) {
  // message's contentType MUST be 'application/json'
  var contentType = message.properties.contentType;

  if (contentType !== 'application/json') {
    throw new Error('unsupported contentType ' + contentType);
  }

  return JSON.parse(message.content.toString());
}
