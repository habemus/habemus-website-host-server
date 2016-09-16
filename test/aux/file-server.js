// native
const path = require('path');

// third-party
const express = require('express');
const multer  = require('multer');

module.exports = function (options) {

  var filesDir   = options.filesDir;
  var uploadsDir = options.uploadsDir;

  if (!path.isAbsolute(filesDir)) {
    throw new Error('filesDir MUST be an absolute path');
  }

  if (!path.isAbsolute(uploadsDir)) {
    throw new Error('uploadsDir MUST be an absolute path');
  }

  var app = express();

  /**
   * Serve files
   */
  app.use('/files', express.static(filesDir));


  /**
   * Upload files
   */
  var upload = multer({ dest: uploadsDir })
  app.post('/uploads',
    upload.single('file'),
    function (req, res, next) {
      res.status(201).json(req.file);
    }
  );

  return app;
};
