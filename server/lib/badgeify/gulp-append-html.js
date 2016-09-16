// native
const util = require('util');

// through2 is a thin wrapper around node transform streams
const through2 = require('through2');
const cheerio  = require('cheerio');

// Plugin level function(dealing with files)
function insertHTML(options) {

  if (!options.html) {
    throw new Error('html is required');
  }

  // get the html string to be appended
  var htmlStrings = Array.isArray(options.html) ? options.html : [options.html];

  // Creating a stream through which each file will pass
  return through2.obj(function(file, enc, cb) {
    if (file.isNull()) {
      // return empty file
      return cb(null, file);
    }

    if (file.isBuffer()) {

      // create a dom object
      var $ = cheerio.load(file.contents.toString());

      // transform it
      var $body = $('body');
      if ($body.length > 0) {
        // attempt to append to body
        $('body').append(htmlStrings.join(''));
      } else {
        // if it does not exist, append to the document
        $.append(htmlStrings.join(''));
      }

      // regenerate the html and set the result as the file's contents
      file.contents = new Buffer($.html());
    }
    if (file.isStream()) {
      throw new Error('gulp-append-html', 'Streams not currently supported');
    }

    cb(null, file);
  });
}

// Exporting the plugin main function
module.exports = insertHTML;