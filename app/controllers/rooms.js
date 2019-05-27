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

  console.log(roomId)

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
