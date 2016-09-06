// constants
const ERROR_DATA = {
  name: true,
  message: true
};

module.exports = function (app, options) {

  const errors = app.errors;

  app.use(function (err, req, res, next) {

    if (err instanceof errors.HWebsiteServerError) {

      switch (err.name) {
        case 'InvalidToken':
          var msg = app.services.messageAPI.error(err, ERROR_DATA);
          res.status(401).json(msg);
          break;
        case 'Unauthorized':
          var msg = app.services.messageAPI.error(err, ERROR_DATA);
          res.status(403).json(msg);
          break;
        case 'InvalidOption':
          var msg = app.services.messageAPI.error(err, {
            name: true,
            option: true,
            kind: true,
            message: true
          });
          res.status(400).json(msg);
          break;
        case 'NotFound':
          var msg = app.services.messageAPI.error(err, {
            name: true,
            resource: true,
            resourceId: true
          });
          res.status(404).json(msg);
          break;
        default:
          next(err);
          break;
      }

    } else {
      next(err);
    }
  });
};