'use strict';

/**
 * Module dependencies.
 */

const Room = require('../models/room.js');
const User = require('../models/user.js');
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
  const filter_type = req.query.filter_type;
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

exports.getRoomsBySubName = async function(req, res) {
  let { _id } = req.decoded;
  let sub_name = req.query.sub_name;

  const options = {
    userId: _id,
    sub_name: sub_name,
  };

  try {
    let rooms = await Room.getRoomsBySubName(options);

    return res.status(200).json(rooms);
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: err.toString(),
    });
  }
};

exports.getQuantityRoomsByUserId = async function(req, res) {
  const { _id } = req.decoded;
  const filter_type = req.query.filter_type;
  const data = await Room.getQuantityRoomsByUserId(_id, filter_type);

  return res.status(200).json(data.length ? data[0] : { result: 0 });
};

exports.getMemberOfRoom = async function(req, res) {
  const { roomId } = req.params;
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
    channel.error(err);

    res.status(500).json({
      results: [],
      isAdmin: false,
    });
  }
};

exports.deleteRoom = async function(req, res) {
  const { _id } = req.decoded;
  const { roomId } = req.body;
  const io = req.app.get('socketIO');

  try {
    await Room.deleteRoom(_id, roomId).then(oldRoomData => {
      oldRoomData.members.map(async member => {
        io.to(member.user).emit('action_room');
      });

      return res.status(200).json({ success: __('room.delete_room.success') });
    });
  } catch (err) {
    channel.error(err);
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
  room.messages = room.messages ? room.messages : [];
  room.messages.push({
    content: __('room.create.message_dafault', { name: room.name }),
    user: _id,
  });

  if (room.avatar) {
    try {
      await files.saveImage(room.avatar, slug(room.name, '-')).then(url => {
        room.avatar = url;
      });
    } catch (err) {
      channel.error(err);

      return res.status(500).json({ error: __('room.create.failed') });
    }
  }

  const io = req.app.get('socketIO');
  const newRoom = new Room(room);

  await newRoom
    .save()
    .then(roomData => {
      if (roomData) {
        roomData.members.map(async member => {
          io.to(member.user).emit('action_room');
        });

        return res.status(200).json({ message: __('room.create.success') });
      }
    })
    .catch(err => {
      channel.error(err);

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
    channel.error(err);

    res.status(500).json({
      error: __('room.invitation.get_error'),
    });
  }
};

exports.createJoinRequest = async function(req, res) {
  let { _id: userId } = req.decoded;
  let { roomId } = req.body;
  const io = req.app.get('socketIO');
  const criteria = { _id: userId };
  const option = 'name email username password twitter github google full_address phone_number';

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

      let numberRequetsJoinRoom = await Room.getNumberOfRequest(roomId);
      io.to(roomId).emit('update_request_join_room_number', numberRequetsJoinRoom);

      let newRequest = await User.load({ select: option, criteria });
      io.to(roomId).emit('add_to_list_rooms', newRequest);

      return res.status(200).json({
        status: config.INVITATION_STATUS.WAITING_APPROVE,
        message: __('room.invitation.join_request'),
      });
    }

    const lastMsgId = room.messages[0]._id;
    await Room.addNewMember(roomId, userId, lastMsgId);

    const newRoom = await Room.getRoomInfoForUserRequestHaveAccept(roomId, [userId]);
    io.to(userId).emit('add_room_to_list', newRoom[0]);

    return res.status(200).json({
      status: config.INVITATION_STATUS.JOIN_AS_MEMBER,
      message: __('room.invitation.join_success'),
    });
  } catch (err) {
    channel.error(err);

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
    channel.error(err);
    res.status(500).json({ error: __('room.delete_member.failed') });
  }
};

exports.listContactsNotMember = async (req, res) => {
  const { roomId, subName } = req.query;
  const { _id } = req.decoded;

  try {
    let listMember = await Room.getListIdMember(roomId);
    listMember = listMember.length ? listMember[0].member : [];
    let listContact = await User.getListNotMember({ _id, subName, listMember });

    return res.status(200).json(listContact);
  } catch (e) {
    channel.error(e);

    return res.status(500).json({ error: e.toString() });
  }
};

exports.addMembers = async (req, res) => {
  const { users } = req.body;
  const { roomId } = req.params;
  try {
    const last_message_id = await Room.getLastMsgId(roomId);
    const result = await Room.addMembers({ roomId, users, last_message_id });
    const response = {
      success: result ? true : false,
      message: __(`room.add_member.${result ? 'success' : 'fail'}`),
    };

    return res.status(200).json(response);
  } catch (err) {
    channel.error(err);

    return res.status(500).json({ error: e.toString() });
  }
};

exports.getInforOfRoom = async function(req, res) {
  const { _id } = req.decoded;
  const { roomId } = req.params;

  try {
    const role = await Room.getRoleOfUser(roomId, _id);
    const isAdmin = role === config.MEMBER_ROLE.ADMIN;
    const isReadOnly = role === config.MEMBER_ROLE.READ_ONLY;
    let lastMsgId = await Room.getLastMsgIdOfUser(roomId, _id);
    let roomInfo = await Room.getInforOfRoom(roomId);

    if (roomInfo.length == 0) {
      throw new Error(__('room.not_found'));
    }

    if (roomInfo[0].type == config.ROOM_TYPE.DIRECT_CHAT) {
      let member = roomInfo[0].members_info.filter(item => item._id != _id);
      roomInfo[0].name = member[0].name;
      roomInfo[0].avatar = member[0].avatar;
    }

    return res.status(200).json({
      isAdmin: isAdmin,
      isReadOnly: isReadOnly,
      lastMsgId: lastMsgId,
      roomInfo: roomInfo[0],
    });
  } catch (err) {
    channel.error(err);

    res.status(500).json({
      err: __('room.get_infor.failed'),
    });
  }
};

exports.getRequestJoinRoom = async (req, res) => {
  const { roomId } = req.params;
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const limit = config.LIMIT_ITEM_SHOW.REQUEST_CONTACT;
  const options = {
    limit: limit,
    page: page,
  };

  try {
    const room = await Room.getRequestJoinRoom(roomId, options);

    if (room.length > 0) {
      return res.status(200).json({ result: room[0]['incoming_requests'] });
    }

    return res.status(200).json({ result: [] });
  } catch (err) {
    channel.error(err);

    res.status(500).json({ error: err.toString() });
  }
};

exports.totalRequest = async (req, res) => {
  let { roomId } = req.params;
  const numberRequests = await Room.getNumberOfRequest(roomId);

  return res.status(200).json({ result: numberRequests });
};

exports.rejectRequests = async (req, res) => {
  let { roomId } = req.params;
  const { requestIds } = req.body;
  const io = req.app.get('socketIO');

  try {
    await Room.rejectRequests(roomId, requestIds);

    let numberRequetsJoinRoom = await Room.getNumberOfRequest(roomId);
    io.to(roomId).emit('update_request_join_room_number', numberRequetsJoinRoom);
    io.to(roomId).emit('remove_from_list_request_join_room', requestIds);

    return res.status(200).json({
      message: __('contact.reject.success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('contact.reject.fail'),
    });
  }
};

exports.acceptRequests = async (req, res) => {
  const { requestIds } = req.body;
  const { roomId } = req.params;
  const io = req.app.get('socketIO');

  try {
    await Room.acceptRequest(roomId, requestIds);
    let numberRequetsJoinRoom = await Room.getNumberOfRequest(roomId);
    let newMemberOfRoom = await Room.getNewMemberOfRoom(roomId, requestIds);

    const rooms = await Room.getRoomInfoForUserRequestHaveAccept(roomId, requestIds);
    rooms.map(room => {
      io.to(room.user).emit('add_room_to_list', room);
    });

    io.to(roomId).emit('update_request_join_room_number', numberRequetsJoinRoom);

    let roomInfo = await Room.getInforOfRoom(roomId);
    io.to(roomId).emit('update_member_of_room', roomInfo[0].members_info);
    io.to(roomId).emit('remove_from_list_request_join_room', requestIds);
    io.to(roomId).emit('add_to_list_members', newMemberOfRoom);

    return res.status(200).json({
      success: __('room.invitation.accept.success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('room.invitation.accept.failed'),
    });
  }
};

exports.togglePinnedRoom = async (req, res) => {
  let { roomId } = req.params;
  let userId = req.decoded._id;
  let pinnedRoom = await Room.getPinnedRoom(roomId, userId);

  try {
    let pinned = !pinnedRoom.members[0].pinned;
    await Room.pinnedRoom(roomId, userId, pinned);

    return res.status(200).json({
      success: __('room.pinned.success', { pinned: pinned ? 'Pin' : 'Unpin' }),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('room.pinned.failed', { pinned: pinned ? 'Pin' : 'Unpin' }),
    });
  }
};

exports.loadMessages = async function(req, res) {
  const { _id } = req.decoded;
  const { roomId } = req.params;
  const prevMsgFlag = req.query.prevMsgFlag;
  const currentMsgId = req.query.currentMsgId;

  try {
    let messages = [];
    if (prevMsgFlag == 1) {
      messages = await Room.loadMessages(roomId, _id, currentMsgId, false);
    } else {
      messages = await Room.loadMessages(roomId, _id, currentMsgId);
    }

    return res.status(200).json({ messages });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      err: __('room.get_next_message.failed'),
    });
  }
};

exports.changeRoleMember = async (req, res) => {
  const { members, roomId } = req.body;

  try {
    await Room.changeRoleMember(roomId, members);

    return res.status(200).json({
      success: __('room.change_role.success'),
    });
  } catch (err) {
    return res.status(500).json({
      error: __('room.change_role.failed'),
    });
  }
};

exports.deleteMessage = async (req, res) => {
  const { messageId, roomId } = req.params;

  try {
    await Room.deleteMessage(messageId, roomId);

    return res.status(200).json({ success: __('room.delete_message.success') });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({ error: __('room.delete_message.failed') });
  }
};

exports.storeMessage = async function(req, res) {
  const io = req.app.get('socketIO');
  const { roomId } = req.params;
  const { _id: userId } = req.decoded;
  const { content } = req.body;

  try {
    const room = await Room.storeMessage(roomId, userId, content);
    const lastMessage = room.messages.pop();
    const message = await Room.getMessageInfo(roomId, lastMessage._id);

    io.to(roomId).emit('send_new_msg', { message: message });

    return res.status(200).json({
      message_id: lastMessage._id,
      message: __('room.message.create.success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('room.message.create.failed'),
    });
  }
};

exports.updateMessage = async function(req, res) {
  const io = req.app.get('socketIO');
  const { roomId, messageId } = req.params;
  const { _id: userId } = req.decoded;
  const { content } = req.body;

  try {
    await Room.updateMessage(roomId, userId, messageId, content);
    const message = await Room.getMessageInfo(roomId, messageId);

    io.to(roomId).emit('update_msg', { message: message });

    return res.status(200).json({
      message: __('room.message.edit.success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('room.message.edit.failed'),
    });
  }
};

exports.editRoom = async (req, res) => {
  const errors = validationResult(req);

  if (errors.array().length > 0) {
    let customErrors = customMessageValidate(errors);

    return res.status(422).json(customErrors);
  }

  let { roomId } = req.params;
  const roomData = req.body;
  const io = req.app.get('socketIO');

  try {
    await Room.findById(roomId).then(async room => {
      if (!room) {
        res.status(404).json({ error: __('room.not_found') });
      }

      if (roomData.avatar) {
        await files.saveImage(roomData.avatar, slug(roomData.name, '-'), room.avatar).then(url => {
          roomData.avatar = url;
        });
      }

      await Room.findOneAndUpdate({ _id: roomId }, { $set: roomData }, { new: true }).then(roomData => {
        roomData.members.map(async member => {
          io.to(member.user).emit('action_room');
        });

        return res.status(200).json({ message: __('room.edit.success') });
      });
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({ error: __('room.edit.failed') });
  }
};
