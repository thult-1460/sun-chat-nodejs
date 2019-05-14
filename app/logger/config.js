module.exports = {
  transports: {
    error: {
      filename: `${__dirname}/%DATE%-error.log`,
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      handleExceptions: true,
      json: true,
      maxsize: '5m', // 5MB
      maxFiles: '7d', // d ~ days
      colorize: false,
    },
    console: {
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
    },
  },
};
