'use strict';

/**
 * Module dependencies.
 */

const Nickname = require('../models/nickname.js');
const Room = require('../models/room.js');
const logger = require('./../logger/winston');
const channel = logger.init('error');

exports.getNicknameByUserInRoom = async (req, res) => {
  const { roomId } = req.params;
  const { _id: userId } = req.decoded;

  try {
    let nicknames = {};
    const results = await Nickname.getList(userId, roomId);

    if (results.length > 0) {
      nicknames = results.reduce((object, nickname, i) => {
        object[nickname.user_id] = nickname.nickname;

        return object;
      }, {});
    }

    return res.status(200).json({ nicknames });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('nickname.get_list.failed'),
    });
  }
};

exports.edit = async function(req, res) {
  const nicknames = req.body;
  const currentRoomId = req.params.roomId;
  const ownerId = req.decoded._id;
  const io = req.app.get('socketIO');

  nicknames.map(nickname => {
    nickname.owner = ownerId;
  })

  const newNicknames = [];
  const existNicknames = [];

  nicknames.map(nickname => {
    nickname.hasOwnProperty('_id') ? existNicknames.push(nickname) : newNicknames.push(nickname);
  });

  try {
    await Nickname.insertMany(newNicknames);

    existNicknames.map(async nickname => {
      nickname.nickname !== '' ? await Nickname.edit(nickname) : await Nickname.delete(nickname)
    });

    const members = await Room.getMembersOfRoom(currentRoomId, ownerId)
    io.to(ownerId).emit('edit_nickname', members.map(member => member.user))


    return res.status(200).json({
      success: __('nickname.edit.success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('nickname.edit.failed'),
    });
  }
};
