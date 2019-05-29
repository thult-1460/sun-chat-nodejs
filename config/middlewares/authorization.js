'use strict';

const { wrap: async } = require('co');
const mongoose = require('mongoose');
const Room = mongoose.model('Room');
const jwt = require('jsonwebtoken');
const logger = require('./../../app/logger/winston.js');
const channel = logger.init('error');
const config = require('../config');
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

    return jwt.sign({ email: user.email, fullName: user.username, _id: user._id }, jwtSecret, {
      expiresIn: expireTokenHour * 60 * 60,
    });
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
    if (req.user.id === req.comment.user.id || req.user.id === req.article.user.id) {
      next();
    } else {
      req.flash('info', 'You are not authorized');
      res.redirect('/articles/' + req.article.id);
    }
  },
};

/**
 * Show member of the room
 */
exports.showMember = async(function*(req, res, next) {
  const { roomId } = req.query;
  let { _id } = req.decoded;
  let isInRoom = false;

  try {
    let result = [];
    const room = yield Room.findOne(
      {
        $and: [{ _id: roomId }, { members: { $elemMatch: { user: _id, deletedAt: null } } }],
      },
      { members: 1 }
    );

    if (room === null) {
      return res.status(403).json({
        error: __('error.403'),
      });
    }

    next();
  } catch (err) {
    channel.error(err.toString());

    return res.status(500).json({
      error: __('error.common'),
    });
  }
});

// middleware check user is admin of room
exports.checkAdmin = async(function*(req, res, next) {
  const { roomId } = req.body;
  let { _id } = req.decoded;

  try {
    const room = yield Room.findOne({
      _id: roomId,
      members: { $elemMatch: { user: _id, role: config.MEMBER_ROLE.ADMIN } },
    }).exec();

    if (room === null) {
      return res.status(403).json({
        error: __('room.not_admin'),
      });
    }

    next();
  } catch (err) {
    channel.error(err.toString());

    return res.status(500).json({
      error: __('error.common'),
    });
  }
});

exports.checkMemberCanJoinRoom = async(function*(req, res, next) {
  let { invitation_code } = req.params;
  let { _id } = req.decoded;

  try {
    let result = [];
    const roomCheckMember = yield Room.findOne(
      {
        $and: [{ invitation_code: invitation_code }, { members: { $elemMatch: { user: _id, deletedAt: null } } }],
      },
      { members: 1 }
    );

    const roomCheckRequest = yield Room.aggregate([
      {
        $match: {
          invitation_code: invitation_code,
          incoming_requests: { $in: [mongoose.Types.ObjectId(_id)] },
        },
      },
    ]);

    if (roomCheckMember !== null) {
      return res.status(200).json({
        status: config.INVITATION_STATUS.IN_ROOM,
        message: __('room.invitation.in_room'),
        room_id: roomCheckMember._id,
      });
    }

    if (roomCheckRequest.length > 0) {
      return res.status(200).json({
        status: config.INVITATION_STATUS.HAVE_REQUEST_BEFORE,
        message: __('room.invitation.requested'),
      });
    }

    next();
  } catch (err) {
    channel.error(err.toString());

    return res.status(500).json({
      error: __('error.common'),
    });
  }
});
