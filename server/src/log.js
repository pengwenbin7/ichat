"use strict";

/**
 * make sure:
 * 1. There is a directory named 'logs';
 * 2. The directory is executable.
 * example:
 * log.info("hello info");
 * log.log("info", "hello info again");
 */

var winston = require("winston");
var timeFormat = () => {
  var d = new Date();
  var t = d.getFullYear() + "-" +
	(d.getMonth() * 1 + 1) + "-" +
    d.getDate() + " " +
    d.getHours() + ":" +
    d.getMinutes() + ":" +
    d.getSeconds();
  return t;
};

module.exports = {
  timeFormat: timeFormat,
  log: (conf) => {
    var logger = new (winston.Logger)({
      transports: [
	new (winston.transports.File)({
	  name: 'info',
	  filename: conf.dir + 'info.log',
	  timestamp:timeFormat,
	  level: 'info',
	}),
	new (winston.transports.File)({
	  name: 'error',
	  filename: conf.dir + 'error.log',
	  timestamp: timeFormat,
	  level: 'error'
	}),
	new (winston.transports.File)({
	  name: 'warn',
	  filename: conf.dir + 'warn.log',
	  timestamp: timeFormat,
	  level: 'warn'
	}),
	new (winston.transports.File)({
	  name: 'debug',
	  filename: conf.dir + 'debug.log',
	  timestamp: timeFormat,
	  level: 'debug'
	})
      ]
    });

    return logger;
  }
}
