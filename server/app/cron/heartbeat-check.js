/**
 * Defines a cron job that publishes
 */

// third-party
const CronJob  = require('cron').CronJob;
const Bluebird = require('bluebird');

// constants
const CONSTANTS = require('../../../../shared/constants');

// at midnight
const DEFAULT_CRON_TIME = '00 00 00 * * *';

module.exports = function (app, options) {
  const CRON_TIME = options.websiteHeartbeatCronTime || DEFAULT_CRON_TIME;

  /**
   * Seconds: 0-59
   * Minutes: 0-59
   * Hours: 0-23
   * Day of Month: 1-31
   * Months: 0-11
   * Day of Week: 0-6
   */
  var job = new CronJob({
    // run
    cronTime: CRON_TIME,
    // cronTime: '0,10,20,30,40,50 * * * * *',
    onTick: function() {

    },
    start: true,
  });

  return job;
}