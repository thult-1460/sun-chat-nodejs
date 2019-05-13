'use strict';

/**
 * This is demo for users.
 */

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const User = mongoose.model('User');
const { validationResult } = require('express-validator/check');
const { user: userMiddleware } = require('../../config/middlewares/authorization.js');
const crypto = require('crypto');
/**
 * Load
 */

exports.load = async(function*(req, res, next, _id) {
  const criteria = { _id };
  try {
    req.profile = yield User.load({ criteria });
    if (!req.profile) return next(new Error('User not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * Create user
 */

exports.create = async(function*(req, res) {
  const user = new User(req.body);
  user.provider = 'local';
  try {
    yield user.save();
    req.logIn(user, err => {
      if (err) req.flash('info', 'Sorry! We are not able to log you in!');
      res.redirect('/');
    });
  } catch (err) {
    const errors = Object.keys(err.errors).map(
      field => err.errors[field].message
    );

    res.render('users/signup', {
      title: 'Sign up',
      errors,
      user,
    });
  }
});

/**
 *  Show profile
 */

exports.show = function(req, res) {
  const user = req.profile;
  res.render('users/show', {
    title: user.name,
    user: user,
  });
};

exports.signin = function() {};

/**
 * Auth callback
 */

exports.authCallback = login;

/**
 * Show login form
 */

exports.login = function(req, res) {
  res.render('users/login', {
    title: 'Login',
  });
};

/**
 * Show sign up form
 */


exports.signup = function(req, res) {
  res.render('users/signup', {
    title: 'Sign up',
    user: new User()
  });
};

exports.apiSignup = function(req, res) {
  const errors = validationResult(req);
  if (errors.array().length > 0) {
    let customErrors = customMessageValidate(errors);

    return res.status(422).json(customErrors);
  }

  const { email, name, username, password } = req.body;

  const active_token = crypto.randomBytes(20).toString('hex');

  new User({
    name,
    email,
    username,
    password,
    active_token,
  }).save(err => {
    if (err) {
      return res.status(500).json({
        error: req.__('register_failed'),
      });
    }

    return res.status(200).json({
      success: req.__('register_successfully'),
    });
  });
};

/**
 * Logout
 */

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/login');
};

/**
 * Session
 */

exports.session = login;

function customMessageValidate(errors) {
  let customErrors = {... errors.array()};
  for (let i in customErrors) {
      customErrors[customErrors[i].param] = customErrors[i].msg
      delete customErrors[i];
  }

  return customErrors;
}

/**
 * Login
 */

function login(req, res) {
  const redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
}

/*
 * Handle validate
 */
function handleValidate(req, res) {
  // Finds the validation errors in this request and wraps them in an object with handy functions
  const errors = validationResult(req);

  if (errors.array().length) {
    res.status(401).json({
      message: 'Authentication failed',
    })
  }
}

/**
 * Hello from other app
 */

exports.hello = function(req, res) {
    res.json({sayHi: 'hello from server, nice to meet you!'})
};

exports.apiLogin = async(function*(req, res) {
  const { email, password } = req.body;
  const jwtSecret = process.env.JWT_SECRET || 'RESTFULAPIs';

  handleValidate(req, res);

  const criteria = {
    email: email,
  }
  try {
    var user = yield User.load({ criteria });
    if (user == null) {
      res.status(401).json({
        message: 'Authentication failed',
      })
    } else if (user.comparePassword(password)) {
      res.status(401).json({
        message: 'Authentication failed',
      })
    } else {
      res.status(200).json({
        message: 'Login successfully',
        token: userMiddleware.generateJWTToken(user),
      })
    }
  } catch (err) {
    res.status(401).json({
      message: 'Authentication failed',
    })
  }
});
