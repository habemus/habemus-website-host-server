// native
const path = require('path');

// third-party
const Bluebird    = require('bluebird');
const vinylFs     = require('vinyl-fs');
const gulpPlumber = require('gulp-plumber');
const gulpIf      = require('gulp-if');

/**
 * Our mini-plugin that appends html strings to the end of the body tag
 * @type {Function}
 */
const gulpAppendHTML = require('./gulp-append-html');

/**
 * List of 'index.html'-ish basenames
 */
const INDEX_HTML_BASENAMES = [
  'index.html',
  'index.htm',
];

/**
 * Function that checks whether the file is an 'index.html' page
 *   
 * @param  {Vinyl}  file
 * @return {Boolean}
 */
function isIndexHTML(file) {
  var basename = path.basename(file.path);

  return INDEX_HTML_BASENAMES.indexOf(basename) !== -1;
}

/**
 * Modifies files in place.
 * 
 * @param  {String} dirPath
 * @return {Bluebird}
 */
function badgeify(dirPath) {

  // glob for all the files
  var glob = path.join(dirPath, '**/*');

  return new Bluebird((resolve, reject) => {

    vinylFs.src(glob)
      .pipe(gulpIf(isIndexHTML, gulpAppendHTML({
        html: [
          '<div>Heeeey!</div>'
        ],
      })))
      .pipe(vinylFs.dest(dirPath))
      .on('error', reject)
      .on('end', resolve);

  });

}

module.exports = badgeify;
