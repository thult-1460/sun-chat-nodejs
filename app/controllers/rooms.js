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
    const members = await Room.getMembersOfRoom(roomId, _id);

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
  const pathRoomAvatar = config.DIR_UPLOAD_FILE.ROOM_AVATAR;

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
    is_notification: true,
    user: _id,
  });

  if (room.avatar) {
    try {
      await files.saveImage(room.avatar, slug(room.name, '-'), pathRoomAvatar).then(url => {
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
        io.to(_id).emit('create_room_success', roomData._id);

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
      io.to(roomId).emit('add_to_list_request_join_room', newRequest);

      return res.status(200).json({
        status: config.INVITATION_STATUS.WAITING_APPROVE,
        message: __('room.invitation.join_request'),
      });
    }

    const lastMsgId = room.messages[0]._id;
    await Room.addNewMember(roomId, userId, lastMsgId);

    const newRoom = await Room.getRoomInfoNewMember(roomId, [userId]);
    io.to(userId).emit('add_to_list_rooms', newRoom[0]);

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
  let { _id: userId } = req.decoded;
  const criteria = { _id: memberId };
  const io = req.app.get('socketIO');

  try {
    if (memberId == userId) {
      throw new Error(__('room.delete_member.myself'));
    }

    const user = await User.load({ criteria });
    const result = await Room.deleteMember(memberId, roomId);

    const content = user.name + ' have been kicked out by admin';
    const room = await Room.storeMessage(roomId, userId, content, true);
    const lastMessage = room.messages.pop();
    const message = await Room.getMessageInfo(roomId, lastMessage._id);
    const roomInfo = await Room.getInforOfRoom(userId, roomId);

    io.to(roomId).emit('update_member_of_room', roomInfo[0].members_info);
    io.to(roomId).emit('send_new_msg', { message: message });
    io.to(memberId).emit('remove_from_list_rooms', { roomId: roomId });
    io.to(roomId).emit('remove_to_list_members', memberId);

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
    let listContact = await Room.getListNotMember({ _id, subName, listMember });

    return res.status(200).json(listContact);
  } catch (e) {
    channel.error(e);

    return res.status(500).json({ error: e.toString() });
  }
};

exports.addMembers = async (req, res) => {
  const { _id: userId } = req.decoded;
  const { users } = req.body;
  const { roomId } = req.params;
  const io = req.app.get('socketIO');

  try {
    let userIds = [];
    users.map(user => {
      userIds.push(user._id);
    });

    const last_message_id = await Room.getLastMsgId(roomId);
    const result = await Room.addMembers({ roomId, users, last_message_id });
    let newMemberOfRoom = await Room.getNewMemberOfRoom(roomId, userIds);
    let roomInfo = await Room.getInforOfRoom(userId, roomId);

    const response = {
      success: result ? true : false,
      message: __(`room.add_member.${result ? 'success' : 'fail'}`),
    };

    const rooms = await Room.getRoomInfoNewMember(roomId, userIds);
    rooms.map(room => {
      io.to(room.user).emit('add_to_list_rooms', room);
    });

    io.to(roomId).emit('add_to_list_members', newMemberOfRoom);
    io.to(roomId).emit('update_member_of_room', roomInfo[0].members_info);

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
    let roomInfo = await Room.getInforOfRoom(_id, roomId);

    if (roomInfo.length == 0) {
      throw new Error(__('room.not_found'));
    }

    if (roomInfo[0].type == config.ROOM_TYPE.DIRECT_CHAT) {
      let member = roomInfo[0].members_info.filter(item => item._id != _id);
      roomInfo[0].name = member[0].name;
      roomInfo[0].avatar = member[0].avatar;
    } else if (roomInfo[0].type == config.ROOM_TYPE.SELF_CHAT) {
      roomInfo[0].avatar = roomInfo[0].members_info[0].avatar;
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
  const { _id: userId } = req.decoded;
  const { requestIds } = req.body;
  const { roomId } = req.params;
  const io = req.app.get('socketIO');

  try {
    await Room.acceptRequest(roomId, requestIds);
    let numberRequetsJoinRoom = await Room.getNumberOfRequest(roomId);
    let newMemberOfRoom = await Room.getNewMemberOfRoom(roomId, requestIds);

    const rooms = await Room.getRoomInfoNewMember(roomId, requestIds);
    rooms.map(room => {
      io.to(room.user).emit('add_to_list_rooms', room);
    });

    io.to(roomId).emit('update_request_join_room_number', numberRequetsJoinRoom);

    let roomInfo = await Room.getInforOfRoom(userId, roomId);
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
  let { _id: userId } = req.decoded;
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

    // Hot fix to load msg. In the future, you must handle by another way
    if (JSON.stringify(messages) == JSON.stringify([{}])) {
      messages = [];
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
  const io = req.app.get('socketIO');
  const { messageId, roomId } = req.params;

  try {
    await Room.deleteMessage(messageId, roomId);
    io.to(roomId).emit('delete-message', messageId);
  } catch (err) {
    channel.error(err);
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

    const members = await Room.getRoomInfoNewMember(roomId);

    members.map(member => {
      io.to(member.user).emit('update_list_rooms_when_receive_msg', {
        sender: userId,
        room: {
          _id: room._id,
          avatar: room.type == 1 ? room.avatar : member.user.avatar,
          type: room.type,
          name: room.name,
          last_created_msg: member.last_created_msg,
          pinned: member.pinned,
          quantity_unread: member.quantity_unread,
        },
      });
    });

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

    io.to(roomId).emit('update_msg', message);

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
  const { _id: userId } = req.decoded;
  const errors = validationResult(req);
  const pathRoomAvatar = config.DIR_UPLOAD_FILE.ROOM_AVATAR;

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
        await files.saveImage(roomData.avatar, slug(roomData.name, '-'), pathRoomAvatar, room.avatar).then(url => {
          roomData.avatar = url;
        });
      } else if (roomData.changeAvatar) {
        roomData.avatar = null;
      }

      await Room.findOneAndUpdate({ _id: roomId }, { $set: roomData }, { new: true }).then(async roomData => {
        roomData.members.map(member => {
          io.to(member.user).emit('action_room');
        });

        let roomInfo = await Room.getInforOfRoom(userId, roomId);
        io.to(roomId).emit('edit_room_successfully', roomInfo[0]);

        return res.status(200).json({ message: __('room.edit.success') });
      });
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({ error: __('room.edit.failed') });
  }
};

exports.getDirectRoomId = async (req, res) => {
  let friendId = req.params.userId;
  let { _id: userId } = req.decoded;

  try {
    let roomId = await Room.getDirectRoomId(userId, friendId);

    return res.status(200).json(...roomId);
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('room.get_room_id.failed'),
    });
  }
};

exports.handleMemberLeaveTheRoom = async (req, res) => {
  const io = req.app.get('socketIO');
  const { roomId } = req.params;
  const { _id: userId } = req.decoded;
  const criteria = { _id: userId };

  try {
    const user = await User.load({ criteria });
    await Room.deleteMember(userId, roomId);

    const content = user.name + ' has left the chat box';
    const room = await Room.storeMessage(roomId, userId, content, true);
    const lastMessage = room.messages.pop();
    const message = await Room.getMessageInfo(roomId, lastMessage._id);
    const roomInfo = await Room.getInforOfRoom(userId, roomId);

    io.to(roomId).emit('update_member_of_room', roomInfo[0].members_info);
    io.to(roomId).emit('send_new_msg', { message: message });
    io.to(userId).emit('remove_from_list_rooms', { roomId: roomId });

    return res.status(200).json({
      message_id: lastMessage._id,
      message: __('room.message.create.success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({ error: __('room.remove_from_list_rooms.failed') });
  }
};

exports.editDescOfRoom = async (req, res) => {
  const io = req.app.get('socketIO');
  const { roomId } = req.params;
  const { desc } = req.body;
  const { _id: userId } = req.decoded;

  try {
    await Room.editDescOfRoom(roomId, desc);

    let roomInfo = await Room.getInforOfRoom(userId, roomId);
    io.to(roomId).emit('edit_desc_of_room_successfully', roomInfo[0].desc);

    return res.status(200).json({ message: __('room.edit.desc.success') });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({ error: __('room.edit.desc.failed') });
  }
};

exports.sendCallingRequest = async (req, res) => {
  const io = req.app.get('socketIO');
  const { checkedList, roomName, liveChatId } = req.body;
  const { roomId } = req.params;
  const { _id: userId } = req.decoded;

  try {
    const inforSelectedMember = await User.showListUsersInfo(checkedList);
    let listMemberHaveTo = '';

    inforSelectedMember.map(member => {
      listMemberHaveTo += `[To:${member._id}] ${member.name}\n`;
    });

    if (checkedList.length > 0) {
      inforSelectedMember.map(member => {
        io.to(member._id).emit('member_receive_notification_join_calling', { roomName, roomId, liveChatId });
      });
    }

    const content =
      `[info][title]Started Sun chat Live[/title]` + listMemberHaveTo + `[live rid=${roomId} id=${liveChatId}] [/info]`;
    let room = await Room.storeMessage(roomId, userId, content);

    const lastMessage = room.messages.pop();
    const message = await Room.getMessageInfo(roomId, lastMessage._id);

    io.to(roomId).emit('send_new_msg', { message: message });

    return res.status(200).json({
      message: __('call-video-audio.sent-noti-success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('call-video-audio.sent-noti-failed'),
    });
  }
};

exports.reactionMsg = async(req, res) => {
  const io = req.app.get('socketIO');
  const { roomId } = req.params;
  const { _id: userId } = req.decoded;
  const { msgId, reactionTag } = req.body;

  try {
    let room = await Room.toggleReactionMsg({ roomId, userId, msgId, reactionTag });
    const message = await Room.getMessageInfo(roomId, msgId);
    io.to(roomId).emit('reaction_msg', message);

    return res.status(200).json({
      message: __('reaction.success'),
    });
  } catch(err) {
    channel.error(err);

    return res.status(500).json({
      error: __('reaction.failed'),
    });
  }
}

exports.getReactionUserListOfMsg = async(req, res) => {
  const io = req.app.get('socketIO');
  const { roomId, msgId, reactionTag } = req.params;
  const { _id: userId } = req.decoded;

  try {
    let listUser = await Room.getUserListByReactionTag({ roomId, msgId, reactionTag });

    return res.status(200).json({ list_user: listUser });
  } catch(err) {
    channel.error(err);

    return res.status(500).json({
      error: __('error.common'),
    });
  }
}

exports.getMessageInfo = async(req, res) => {
  const { roomId, messageId} = req.params;

  try {
    const message = await Room.getMessageInfo(roomId, messageId);

    return res.status(200).json({
      message: message
    })
  } catch(err) {
    channel.error(err);

    return res.status(500).json({
      error: __('error.common'),
    });
  }
}
