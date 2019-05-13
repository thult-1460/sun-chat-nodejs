'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, errors, json, timestamp, splat, printf } = format;

const options = {
  file_error: {
    level: 'error',
    filename: `${__dirname}/error.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  file_info: {
    level: 'info',
    filename: `${__dirname}/info.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const logger = createLogger({
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    errors({ stack: true }),
    splat(),
    json(),
    printf(info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? ' - ' + info.stack : ''}`)
  ),
  transports: [new transports.File(options.file_error), new transports.File(options.file_info)],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console(options.console));
}

module.exports = logger;
