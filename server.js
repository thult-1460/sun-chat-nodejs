'use strict';

/**
 * Module dependencies
 */

require('dotenv').config();

const fs = require('fs');
const join = require('path').join;
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const config = require('./config');
const moment = require('moment-timezone');
const models = join(__dirname, 'app/models');
const port = process.env.PORT || 3001;
const app = express();
const i18n = require('i18n');
const { timezone } = require('./config/app.js');
moment.tz.setDefault(timezone);

i18n.configure({
  locales: ['vi', 'en'],
  directory: __dirname + '/locales',
  defaultLocale: 'vi',
});
app.use(i18n.init);

/**
 * Expose
 */

module.exports = app;

// Bootstrap models
fs.readdirSync(models)
  .filter(file => ~file.search(/^[^.].*\.js$/))
  .forEach(file => require(join(models, file)));

// Bootstrap routes
require('./config/passport')(passport);
require('./config/express')(app, passport);
require('./config/routes')(app, passport);

connect();

function listen() {
  if (app.get('env') === 'test') return;
  app.listen(port);
  console.log('Express app started on port ' + port);
}

function connect() {
  mongoose.connection
    .on('error', console.log)
    .on('disconnected', connect)
    .once('open', listen);
  return mongoose.connect(config.db, { keepAlive: 1, useNewUrlParser: true });
}
