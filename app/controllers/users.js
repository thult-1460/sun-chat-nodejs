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
      user
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
    user: user
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
    title: 'Login'
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
    res.json({
      status: 401,
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
      res.json({
        status: 401,
        message: 'Authentication failed',
      })
    } else if (user.comparePassword(password)) {
      res.json({
        status: 401,
        message: 'Authentication failed',
      })
    } else {
      res.json({
        message: 'Login successfully',
        token: userMiddleware.generateJWTToken(user),
      })
    }
  } catch (err) {
    res.json({
      status: 401,
      message: 'Authentication failed',
    })
  }
});
