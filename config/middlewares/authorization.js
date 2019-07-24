'use strict';

const { wrap: async } = require('co');
const mongoose = require('mongoose');
const Room = mongoose.model('Room');
const User = mongoose.model('User');
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

  checkUserActivated: async function(req, res, next) {
    let userIdReceive = req.body.userId;

    try {
      const user = await User.findOne({ $and: [{ _id: userIdReceive }, { active: true }] });

      if (user == null) {
        return res.status(403).json({
          error: __('user.user_not_exist'),
        });
      }

      next();
    } catch (err) {
      channel.error(err);

      return res.status(500).json({
        error: __('error.common'),
      });
    }
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

/*
 * Room authorization routing middleware
 */

exports.room = {
  hasAuthorization: async function(req, res, next) {
    const { roomId } = req.params;
    const { _id } = req.decoded;

    try {
      const room = await Room.findOne({
        _id: roomId,
        deletedAt: null,
        members: { $elemMatch: { user: _id, deletedAt: null } },
      });

      if (room === null) {
        return res.status(403).json({
          err: __('room.user_not_in_room'),
        });
      }

      next();
    } catch (err) {
      channel.error(err);

      return res.status(500).json({
        err: __('error.common'),
      });
    }
  },

  checkAdmin: async function(req, res, next) {
    let { roomId } = req.body;
    let { _id } = req.decoded;

    if (roomId == undefined) {
      roomId = req.params.roomId;
    }

    try {
      const room = await Room.findOne({
        _id: roomId,
        deletedAt: null,
        members: { $elemMatch: { user: _id, role: config.MEMBER_ROLE.ADMIN } },
      }).exec();

      if (room === null) {
        return res.status(403).json({
          error: __('room.not_admin'),
        });
      }

      next();
    } catch (err) {
      channel.error(err);

      return res.status(500).json({
        error: __('error.common'),
      });
    }
  },

  checkMemberCanJoinRoom: async function(req, res, next) {
    let { invitation_code } = req.params;
    let { _id } = req.decoded;

    try {
      let result = [];
      const roomCheckMember = await Room.findOne(
        {
          $and: [
            { invitation_code: invitation_code, deletedAt: null },
            { members: { $elemMatch: { user: _id, deletedAt: null } } },
          ],
        },
        { members: 1 }
      );

      const roomCheckRequest = await Room.aggregate([
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
      channel.error(err);

      return res.status(500).json({
        error: __('error.common'),
      });
    }
  },

  checkDeleteSelf: function(req, res, next) {
    const { memberId } = req.body;
    let { _id } = req.decoded;

    if (memberId == _id) {
      return res.status(403).json({
        error: __('room.not_me'),
      });
    }

    next();
  },

  updateMessage: async function(req, res, next) {
    let { roomId, messageId } = req.params;
    let { _id } = req.decoded;

    try {
      const room = await Room.findOne({
        _id: roomId,
        deletedAt: null,
        members: { $elemMatch: { user: _id, role: { $ne: config.MEMBER_ROLE.READ_ONLY }, deletedAt: null } },
        messages: { $elemMatch: { _id: messageId, user: _id, deletedAt: null } },
      }).exec();

      if (room === null) {
        return res.status(403).json({
          error: __('error.403'),
        });
      }

      next();
    } catch (err) {
      channel.error(err);

      return res.status(500).json({
        error: __('error.common'),
      });
    }
  },

  createMessage: async function(req, res, next) {
    const { roomId } = req.params;
    const { _id: userId } = req.decoded;

    try {
      const room = await Room.findOne({
        _id: roomId,
        deletedAt: null,
        members: {
          $elemMatch: {
            user: userId,
            deletedAt: null,
            role: { $ne: config.MEMBER_ROLE.READ_ONLY },
          },
        },
      });

      if (room == null) {
        return res.status(403).json({
          error: __('error.403'),
        });
      }

      next();
    } catch (err) {
      channel.error(err);

      return res.status(500).json({
        error: __('error.common'),
      });
    }
  },

  checkExistMember: async function(req, res, next) {
    let { roomId, users } = req.body;

    try {
      const listExist = await Room.aggregate([
        {
          $match: { _id: mongoose.Types.ObjectId(roomId), deletedAt: null },
        },
        {
          $unwind: '$members',
        },
        {
          $match: { $expr: { $in: ['$members.user', users] }, 'members.deletedAt': null },
        },
      ]).exec();

      if (listExist.length) {
        return res.status(403).json({
          error: __('room.exist_member'),
        });
      }

      next();
    } catch (err) {
      channel.error(err);

      return res.status(500).json({
        error: __('error.common'),
      });
    }
  },

  leaveRoom: async function(req, res, next) {
    const { _id: userId } = req.decoded;
    const { roomId } = req.params;

    try {
      const myChatRoomId = await Room.getRoomMyChatId(userId);

      if (myChatRoomId.length > 0 && roomId == myChatRoomId[0]._id) {
        return res.status(403).json({
          error: __('room.my_chat.cant_leave'),
        });
      }

      next();
    } catch (err) {
      channel.error(err);

      return res.status(500).json({
        error: __('error.common'),
      });
    }
  },
};

exports.tasks = {
  isAssignee: async function(req, res, next) {
    const { _id: userId } = req.decoded;
    const { roomId, taskId } = req.params;

    try {
      const task = await Room.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(roomId), deletedAt: null } },
        { $unwind: '$tasks' },
        {
          $match: {
            'tasks._id': mongoose.Types.ObjectId(taskId),
            'tasks.deletedAt': null,
          },
        },
        {
          $addFields: {
            'tasks.assignees': {
              $filter: {
                input: '$tasks.assignees',
                as: 'assignee',
                cond: {
                  $eq: ['$$assignee.deletedAt', null],
                },
              },
            },
          },
        },
        {
          $match: {
            $expr: {
              $in: [mongoose.Types.ObjectId(userId), '$tasks.assignees.user'],
            },
          },
        },
      ]);

      if (task.length == 0) {
        return res.status(403).json({
          error: __('task.finish.authorization'),
        });
      }

      next();
    } catch (err) {
      channel.error(err);

      return res.status(500).json({
        error: __('error.common'),
      });
    }
  },

  editTask: async function(req, res, next) {
    try {
      const { roomId, taskId } = req.params;
      const { _id: userId } = req.decoded;

      const task = await Room.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(roomId), deletedAt: null } },
        { $unwind: '$tasks' },
        {
          $match: {
            'tasks._id': mongoose.Types.ObjectId(taskId),
            'tasks.assigner': mongoose.Types.ObjectId(userId),
          },
        },
        {
          $project: {
            tasks: 1,
          },
        },
      ]);

      if (task.length == 0) {
        return res.status(403).json({
          error: __('task.edit.authorization'),
        });
      }

      next();
    } catch (err) {
      channel.error(err);

      return res.status(500).json({
        error: __('error.common'),
      });
    }
  },
};
