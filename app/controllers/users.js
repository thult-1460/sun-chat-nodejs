'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const User = mongoose.model('User');
const { validationResult } = require('express-validator/check');
const { user: userMiddleware } = require('../../config/middlewares/authorization.js');
const crypto = require('crypto');
const mailer = require('../mailer/email.action');
mongoose.set('useFindAndModify', false);
const config = require('../../config/config');
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
    const errors = Object.keys(err.errors).map(field => err.errors[field].message);

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
    user: new User(),
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

  const user = new User({
    name,
    email,
    username,
    password,
    active_token,
  });

  user.save(err => {
    if (err) {
      res.status(500).json({
        error: req.__('register_failed'),
      });
    }

    mailer
      .activeEmail(user)
      .then(result => res.status(200).json({ msg: result }))
      .catch(err => console.log(err));
  });
};

/**
 *  Confirm Email
 */
exports.confirmEmail = function(req, res) {
  const { userId, active_token } = req.params;

  User.findById(userId)
    .then(user => {
      if (!user) {
        res.status(401).json({ msg: __('mail.couldNotFind') });
      } else if (user.active) {
        res.status(200).json({ msg: __('mail.alreadyConfirmed') });
      }

      if (active_token !== user.active_token) {
        res.status(401).json({ msg: __('token_invalid') });
      }

      if (new Date(user.active_token_expire) < new Date()) {
        res.status(412).json({ msg: __('mail.expired_token') });
      }

      User.findOneAndUpdate(userId, {
        active: true,
        active_token: null,
        active_token_expire: null,
      })
        .then(() => res.status(200).json({ msg: __('mail.confirmed') }))
        .catch(err => console.log(err));
    })
    .catch(err => res.status(500).json({ msg: __('mail.confirm_failed') }));
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
  let customErrors = { ...errors.array() };
  for (let i in customErrors) {
    customErrors[customErrors[i].param] = customErrors[i].msg;
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
  const errors = validationResult(req);

  if (errors.array().length > 0) {
    let customErrors = customMessageValidate(errors);
    res.status(422).json(customErrors);

    return false;
  }

  return true;
}

/**
 * Hello from other app
 */
exports.hello = function(req, res) {
  res.json({ sayHi: 'hello from server, nice to meet you!' });
};

exports.apiLogin = async(function*(req, res) {
  const { email, password } = req.body;
  const jwtSecret = process.env.JWT_SECRET || 'RESTFULAPIs';

  if (handleValidate(req, res) === false) {
    return res;
  }

  const criteria = {
    email: email,
  };
  try {
    var user = yield User.load({ criteria });
    if (user == null) {
      res.status(401).json({
        message: __('authentication_failed'),
      });
    } else if (user.comparePassword(password)) {
      res.status(401).json({
        message: __('authentication_failed'),
      });
    } else {
      res.status(200).json({
        message: __('login_successfully'),
        token: userMiddleware.generateJWTToken(user),
      });
    }
  } catch (err) {
    res.status(500).json({
      message: __('authentication_failed'),
    });
  }
});

exports.contactRequest = async(function*(req, res) {
  let { _id } = req.decoded;
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const limit = config.LIMIT_ITEM_SHOW;
  const options = {
    limit: limit,
    page: page,
  };
  const contact = yield User.getMyContactRequest(_id, options);
  res.json({ result: contact[0]['requested_in_comming'] });
});

exports.totalContactRequest = async(function*(req, res) {
  let { _id } = req.decoded;
  const data = yield User.getAllContactRequest(_id);
  res.json({ result: data[0]['number_of_contact'] });
});

/**
 *  Change password
 */
exports.apiChangePassword = async(function*(req, res) {
  const { current_password, new_password, confirm_password } = req.body;
  const criteria = { _id: req.decoded._id };

  try {
    var user = yield User.load({ criteria });

    if (handleValidate(req, res) === false) {
      return res;
    }

    if (!user) {
      return res.status(401).json({
        error: __('change_password.user_not_found'),
      });
    }

    if (!user.authenticate(current_password)) {
      return res.status(422).json({
        error: __('change_password.old_password_incorrect'),
      });
    }

    if (new_password === current_password) {
      return res.status(422).json({
        error: __('change_password.compare_current_and_new_password_failed'),
      });
    }

    user.updatePassword(new_password);
    res.status(200).json({
      success: __('change_password.update_successfully'),
    });
  } catch (err) {
    res.status(500).json({
      error: __('change_password.change_password_failed'),
    });
  }
});
