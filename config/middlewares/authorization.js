'use strict';

const jwt = require('jsonwebtoken');
/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = function(req, res, next) {
  if (req.isAuthenticated()) return next();
  if (req.method == 'GET') req.session.returnTo = req.originalUrl;
  res.redirect('/login');
};

exports.requiresAPILogin = function(req, res, next) {
  const jwtSecret = process.env.JWT_SECRET || 'RESTFULAPIs';

  try {
    jwt.verify(req.headers.authorization, jwtSecret);

    return next();
  } catch (err) {
    res.json({
      status: 401,
      message: 'Error token',
      error: err.message,
    });
  }
};
/*
 *  User authorization routing middleware
 */

exports.user = {
  hasAuthorization: function(req, res, next) {
    if (req.profile.id != req.user.id) {
      req.flash('info', 'You are not authorized');
      return res.redirect('/users/' + req.profile.id);
    }
    next();
  },

  generateJWTToken: function(user) {
    const jwtSecret = process.env.JWT_SECRET || 'RESTFULAPIs';
    const expireTokenHour = process.env.JWT_TTL;

    return jwt.sign(
      { email: user.email, fullName: user.username, _id: user._id },
      jwtSecret,
      { expiresIn: expireTokenHour * 60 * 60 }
    );
  },
};

/*
 *  Article authorization routing middleware
 */

exports.article = {
  hasAuthorization: function(req, res, next) {
    if (req.article.user.id != req.user.id) {
      req.flash('info', 'You are not authorized');
      return res.redirect('/articles/' + req.article.id);
    }
    next();
  },
};

/**
 * Comment authorization routing middleware
 */

exports.comment = {
  hasAuthorization: function(req, res, next) {
    // if the current user is comment owner or article owner
    // give them authority to delete
    if (
      req.user.id === req.comment.user.id ||
      req.user.id === req.article.user.id
    ) {
      next();
    } else {
      req.flash('info', 'You are not authorized');
      res.redirect('/articles/' + req.article.id);
    }
  },
};
