'use strict';

const Room = require('../models/room.js');
const logger = require('./../logger/winston');
const channel = logger.init('error');
const config = require('../../config/config');

exports.create = async (req, res) => {
  let { _id: userId } = req.decoded;
  let { roomId, callType } = req.body;
  let success = false,
    liveChat = {},
    message = __('socket.live_chat.create.fail');

  try {
    liveChat = await Room.getLiveChat({ roomId, userId });

    if (!liveChat) {
      const result = await Room.createLiveChat({ roomId, userId, callType });

      if (result) {
        success = true;
        message = '';
        liveChat = await Room.getLiveChat({ roomId, userId });
      }
    }

    res.status(200).json({
      success: success,
      id: liveChat.liveId ? liveChat.liveId : null,
      message: message,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: message });
  }
};

exports.offerBeJoined = async (req, res) => {
  let { _id: userId } = req.decoded;
  let { roomId, liveChatId, info } = req.body;
  const io = req.app.get('socketIO');
  let masterId = null,
    message = __('socket.live_chat.offer.fail');

  const liveChat = await Room.getLiveChat({ roomId, masterId, liveChatId });

  if (liveChat.member !== undefined) {
    masterId = liveChat.member.user_id;
    io.to(masterId).emit('change-offer-list', { roomId, userId, info });
    message = '';
  }

  res.status(200).json({ success: !!masterId, message: message });
};

exports.checkMaster = async (req, res) => {
  let { _id: userId } = req.decoded;
  let { roomId, liveChatId } = req.body;

  try {
    let result = await Room.getLiveChat({ roomId, userId, liveChatId });

    res.status(200).json({ status: !!result });
  } catch (err) {
    channel.error(err);
  }
};

exports.acceptMember = async (req, res) => {
  let { roomId, memberId, liveChatId } = req.body;
  let message = __('socket.live_chat.accept.fail');
  const io = req.app.get('socketIO');

  try {
    const result = await Room.acceptMemberLiveChat(roomId, liveChatId, memberId);

    if (result) {
      io.to(memberId).emit('be-accepted-by-master', { accepted: true });

      const listMember = await Room.getListMemberLiveChat(roomId, liveChatId);
      io.to(liveChatId).emit('list-member-live-chat', { listMember: listMember[0].members, offerId: memberId });
      io.to(memberId).emit('list-member-live-chat', { listMember: listMember[0].members, offerId: memberId });
      message = '';
    }

    res.status(200).json({ success: !!result, message: message });
  } catch (err) {
    channel.error(err);
  }
};

exports.leaveLiveChat = async (req, res) => {
  let { _id: userId } = req.decoded;
  let { roomId, liveChatId } = req.body;
  let message = __('socket.live_chat.leave.fail');

  try {
    let result = await Room.updateStatusCallMember(
      roomId,
      liveChatId,
      userId,
      null,
      config.CALL.PARTICIPANT.STATUS.HANGUP
    );

    return res.status(200).json({ success: !!result, message: result ? message : '' });
  } catch (e) {
    channel.error(e);

    return res.status(500).json({ message: message });
  }
}
