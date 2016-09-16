// third-party dependencies
const gulp     = require('gulp');
const istanbul = require('gulp-istanbul');
const mocha    = require('gulp-mocha');

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
    // Enforce a coverage of at least 90%
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }))
    .on('error', (err) => {
      this.emit('error', err);
    });
});
