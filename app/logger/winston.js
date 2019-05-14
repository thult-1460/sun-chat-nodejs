'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, errors, json, timestamp, splat, printf } = format;
const dailyRotateFile = require('winston-daily-rotate-file');

const config = require('./config');

module.exports = {
  init: (channel = 'error') => {
    if (typeof config.transports[channel] === 'undefined') {
      return `Config channel ${channel} not found`;
    }

    let logger = createLogger({
      format: combine(
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        errors({ stack: true }),
        splat(),
        json(),
        printf(info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? ' - ' + info.stack : ''}`)
      ),
      transports: [new dailyRotateFile(config.transports[channel])],
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.add(new transports.Console(config.transports.console));
    }

    return logger;
  },
};
