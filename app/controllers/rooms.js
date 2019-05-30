'use strict';

/**
 * Module dependencies.
 */

const Room = require('../models/room.js');
const slug = require('slug');
const { validationResult } = require('express-validator/check');
const files = require('../services/files.js');
const logger = require('./../logger/winston');
const channel = logger.init('error');
const config = require('../../config/config');

function customMessageValidate(errors) {
  let customErrors = { ...errors.array() };
  for (let i in customErrors) {
    let param = customErrors[i].param;

    if (customErrors[param] == undefined) {
      customErrors[param] = '';
    } else {
      customErrors[param] += ', ';
    }

    customErrors[param] += customErrors[i].msg;
    delete customErrors[i];
  }

  return customErrors;
}

exports.index = async function(req, res) {
  let { _id } = req.decoded;
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const filter_type = req.query.filter_type >= 0 ? req.query.filter_type : 0;
  const limit = config.LIMIT_ITEM_SHOW.ROOM;
  const options = {
    userId: _id,
    filter_type: filter_type,
    limit: limit,
    page: page,
  };
  let rooms = await Room.getListRoomByUserId(options);

  return res.status(200).json(rooms);
};

exports.getQuantityRoomsByUserId = async function(req, res) {
  const { _id } = req.decoded;
  const filter_type = req.query.filter_type >= 0 ? req.query.filter_type : 0;
  const data = await Room.getQuantityRoomsByUserId({ _id, filter_type });

  res.json(data.length ? { result: 0 } : data[0]);
};

exports.getMemberOfRoom = async function(req, res) {
  const { roomId } = req.query;
  let { _id } = req.decoded;
  let isAdmin = false;

  try {
    let results = [];
    const members = await Room.getMembersOfRoom(roomId);

    members.map(function(member) {
      let { _id: memberId } = member.user;

      if (memberId == _id && member.members.role === config.MEMBER_ROLE.ADMIN) {
        isAdmin = true;
      }

      results.push(
        Object.assign(member.user, {
          role: Object.keys(config.MEMBER_ROLE)
            .find(key => config.MEMBER_ROLE[key] === member.members.role)
            .toLowerCase(),
        })
      );
    });

    res.status(200).json({
      results: {
        members: results,
        isAdmin: isAdmin,
        userId: _id,
      },
    });
  } catch (err) {
    channel.error(err.toString());

    res.status(500).json({
      results: [],
      isAdmin: false,
    });
  }
};

exports.deleteRoom = async function(req, res) {
  const { _id } = req.decoded;
  const { roomId } = req.body;

  try {
    const result = await Room.deleteRoom(_id, roomId);

    if (!result) throw new Error(__('room.delete_room.failed'));

    return res.status(200).json({ success: __('room.delete_room.success') });
  } catch (err) {
    channel.error(err.toString());
    res.status(500).json({ error: __('room.delete_room.failed') });
  }
};

exports.createRoom = async (req, res) => {
  const errors = validationResult(req);

  if (errors.array().length > 0) {
    let customErrors = customMessageValidate(errors);

    return res.status(422).json(customErrors);
  }

  const { _id, fullName } = req.decoded;
  const room = req.body;
  room.name = room.name ? room.name : fullName;
  room.members.push({ user: _id, role: config.MEMBER_ROLE.ADMIN });

  if (room.avatar_url) {
    try {
      await files.saveImage(room.avatar_url, slug(room.name, '-')).then(url => {
        room.avatar_url = url;
      });
    } catch (err) {
      channel.error(err.toString());

      return res.status(500).json({ error: __('room.create.failed') });
    }
  }

  const newRoom = new Room(room);

  await newRoom
    .save()
    .then(result => {
      if (result) return res.status(200).json({ message: __('room.create.success') });
    })
    .catch(err => {
      channel.error(err.toString());

      return res.status(500).json({ error: __('room.create.failed') });
    });
};

exports.checkInvitationCode = async function(req, res) {
  let { invitation_code } = req.params;

  try {
    const room = await Room.getRoomInfoByInvitateCode(invitation_code);

    if (room === null) {
      throw new Error(__('error.404'));
    }

    return res.status(200).json({
      room: room,
    });
  } catch (err) {
    channel.error(err.toString());

    res.status(500).json({
      error: __('room.invitation.get_error'),
    });
  }
};

exports.createJoinRequest = async function(req, res) {
  let { _id: userId } = req.decoded;
  let { roomId } = req.body;

  try {
    const room = await Room.findOne(
      {
        _id: roomId,
      },
      { messages: { $slice: -1 }, invitation_type: 1 }
    );

    if (room === null) {
      return res.status(404).json({
        error: __('error.404'),
      });
    }

    if (room.invitation_type == config.INVITATION_TYPE.CANNOT_REQUEST) {
      return res.status(200).json({
        status: config.INVITATION_STATUS.CANT_JOIN,
        message: __('room.invitation.cant_join'),
      });
    } else if (room.invitation_type == config.INVITATION_TYPE.NEED_APPROVAL) {
      await Room.addJoinRequest(roomId, userId);

      return res.status(200).json({
        status: config.INVITATION_STATUS.WAITING_APPROVE,
        message: __('room.invitation.join_request'),
      });
    }

    const lastMsgId = room.messages[0]._id;
    await Room.addNewMember(roomId, userId, lastMsgId);

    return res.status(200).json({
      status: config.INVITATION_STATUS.JOIN_AS_MEMBER,
      message: __('room.invitation.join_success'),
    });
  } catch (err) {
    channel.error(err.toString());

    return res.status(500).json({
      error: err.toString(),
    });
  }
};

exports.deleteMember = async (req, res) => {
  const { memberId, roomId } = req.body;
  const userId = req.decoded._id;

  try {
    if (memberId == userId) {
      throw new Error(__('room.delete_member.myself'));
    }

    const result = await Room.deleteMember(memberId, roomId);

    if (!result) throw new Error(__('room.delete_member.failed'));

    return res.status(200).json({ success: __('room.delete_member.success') });
  } catch (err) {
    channel.error(err.toString());
    res.status(500).json({ error: __('room.delete_member.failed') });
  }
};

exports.getInforOfRoom = async function(req, res) {
  const { _id } = req.decoded;
  const { roomId } = req.params;

  try {
    const isAdmin = await Room.checkAdmin(roomId, _id);
    let roomInfo = await Room.getInforOfRoom(roomId);

    if (roomInfo.length == 0) {
      throw new Error(__('room.not_found'));
    }

    if (roomInfo[0].type == config.ROOM_TYPE.DIRECT_CHAT) {
      let member = roomInfo[0].members_info.filter(item => item._id != _id);
      roomInfo[0].name = member[0].name;
      roomInfo[0].avatar_url = member[0].avatar;
    }

    return res.status(200).json({
      isAdmin: isAdmin,
      roomInfo: roomInfo[0],
    });
  } catch (err) {
    channel.error(err.toString());
    res.status(500).json({
      err: __('room.get_infor.failed'),
    });
  }
};
