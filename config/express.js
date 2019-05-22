'use strict';

/**
 * Module dependencies.
 */

const express = require('express');
const session = require('express-session');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const i18n = require('i18n');
const methodOverride = require('method-override');
// const csrf = require('csurf');
const cors = require('cors');
const helmet = require('helmet');
const upload = require('multer')();

const mongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const winston = require('winston');
const helpers = require('view-helpers');
// const ultimatePagination = require('ultimate-pagination');
const requireHttps = require('./middlewares/require-https');
const config = require('./');
const pkg = require('../package.json');

const env = process.env.NODE_ENV || 'development';
const apiRoutes = require('../routes/api');

/**
 * Expose
 */

module.exports = function(app, passport) {
  app.use(helmet());
  app.use(requireHttps);

  // Compression middleware (should be placed before express.static)
  app.use(
    compression({
      threshold: 512,
    })
  );

  app.use(
    cors({
      origin: ['http://localhost:3000'],
      optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
      credentials: true,
    })
  );

  // Static files middleware
  app.use(express.static(config.root + '/public'));

  // Use winston on production
  let log = 'dev';
  if (env !== 'development') {
    log = {
      stream: {
        write: message => winston.info(message),
      },
    };
  }

  // Don't log during tests
  // Logging middleware
  if (env !== 'test') app.use(morgan(log));

  // set views path, template engine and default layout
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'pug');

  // expose package.json to views
  app.use(function(req, res, next) {
    res.locals.pkg = pkg;
    res.locals.env = env;
    next();
  });

  // bodyParser should be above methodOverride
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(upload.single('image'));
  app.use(
    methodOverride(function(req) {
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
      }
    })
  );

  // CookieParser should be above session
  app.use(cookieParser());
  app.use(expressValidator());
  app.use(
    session({
      resave: false,
      saveUninitialized: true,
      secret: pkg.name,
      store: new mongoStore({
        url: config.db,
        collection: 'sessions',
      }),
    })
  );

  // Languages
  i18n.configure({
    locales: ['en', 'vi'],
    register: global,
    fallbacks: { vi: 'en' },
    cookie: 'lang',
    queryParameter: 'lang',
    defaultLocale: 'en',
    directory: __dirname + '/../lang',
    directoryPermissions: '755',
    autoReload: true,
    updateFiles: true,
    objectNotation: true,
    api: {
      __: '__', //now req.__ becomes req.__, can change alias other
      __n: '__n', //and req.__n can be called as req.__n
    },
  });

  app.use(function(req, res, next) {
    i18n.init(req, res, next);
  });

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(function(req, res, next) {
    res.locals.clanguage = req.getLocale();
    i18n.setLocale(res.locals.clanguage);
    res.locals.languages = i18n.getLocales();
    next();
  });

  // connect flash for flash messages - should be declared after sessions
  app.use(flash());

  // should be declared after session and flash
  app.use(helpers(pkg.name));

  // Remove csrf_field temporary
  // if (env !== 'test') {
  //   app.use(csrf());
  //   // This could be moved to view-helpers :-)
  //   app.use(function(req, res, next) {
  //     res.locals.csrf_token = req.csrfToken();
  //     res.locals.paginate = ultimatePagination.getPaginationModel;
  //     next();
  //   });
  // }
  
  // API
  app.use('/api', apiRoutes);

  if (env === 'development') {
    app.locals.pretty = true;
  }
};
