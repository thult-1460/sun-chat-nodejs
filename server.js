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
const http = require('http');
const ExpressPeerServer = require('peer').ExpressPeerServer;

const { timezone } = require('./config/app.js');
moment.tz.setDefault(timezone);

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
// require('./config/routes')(app, passport);

const server = http.createServer(app);
const io = require('socket.io').listen(server);
app.set('socketIO', io);
require('./app/controllers/socket')(io);

const options = {
  debug: true,
};

const peerserver = ExpressPeerServer(server, options);
app.use('/peerjs', peerserver);
peerserver.on('connection', client => {
  console.log('peerserver: client connected!', client);
});
peerserver.on('disconnect', client => {
  console.log('peerserver: client disconnected!', client);
});

connect();

function listen() {
  if (app.get('env') === 'test') return;
  server.listen(port);
  console.log('Express app started on port ' + port);
}

function connect() {
  mongoose.connection
    .on('error', console.log)
    .on('disconnected', connect)
    .once('open', listen);
  return mongoose.connect(config.db, { keepAlive: 1, useNewUrlParser: true });
}
