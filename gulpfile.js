// native
const path = require('path');

// third-party dependencies
const gulp     = require('gulp');
const istanbul = require('gulp-istanbul');
const mocha    = require('gulp-mocha');
const gulpNodemon = require('gulp-nodemon');

gulp.task('pre-test', function () {
  return gulp.src(['server/**/*.js', 'shared/**/*.js', 'client/**/*.js'])
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
  return gulp.src(['test/tests/**/*.js'])
    .pipe(mocha())
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports())
    // Enforce a coverage of at least 60%
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 60 } }))
    .on('error', (err) => {
      this.emit('error', err);
    });
});


/**
 * Run server and restart it everytime server file changes
 */
gulp.task('nodemon', function () {
  gulpNodemon({
    script: 'cli/start.js',
    env: {
      PORT: 5002,

      RABBIT_MQ_URI: 'amqp://192.168.99.100',

      H_WEBSITE_URI: 'http://localhost:5001',
      H_WEBSITE_TOKEN: 'TOKEN',

      WEBSITES_STORAGE_FS_ROOT: path.join(__dirname, 'tmp/storage'),
      WEBSITES_SERVER_FS_ROOT: path.join(__dirname, 'tmp/server'),

      HOST_DOMAIN: 'dev.habem.us',
    },
    ext: 'js',
    ignore: [
      'client/**/*',
      'dist/**/*',
      'gulpfile.js',
      'tmp/**/*',
    ],
  })
});