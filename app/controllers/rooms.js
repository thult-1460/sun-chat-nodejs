'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
const logger = require('./../logger/winston');
const channel = logger.init('error');
const Room = mongoose.model('Room');
const config = require('../../config/config');

exports.index = async function(req, res) {
  let { _id } = req.decoded;
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const filter_type = req.query.filter_type >= 0 ? req.query.filter_type : 0;
  const limit = config.LIMIT_ITEM_SHOW;
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

  res.json({ result: data[0].result });
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
