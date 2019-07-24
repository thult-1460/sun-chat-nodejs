'use strict';

/**
 * Module dependencies.
 */

const Room = require('../models/room.js');
const NickName = require('../models/nickname.js');
const logger = require('./../logger/winston');
const channel = logger.init('error');

exports.getNickNameByUserRoom = async (req, res) => {
    const { roomId } = req.params;
    const { _id: userId } = req.decoded;

    try {
        let listNickName = {};
        const results = await NickName.getList(userId, roomId);

        if (results.length > 0) {
            listNickName = results.reduce(function(object, nickname, i) {
              object[nickname.user_id] = nickname.nickname;

              return object;
            }, {});
        }

        return res.status(200).json({ listNickName });

    } catch (err) {
        channel.error(err);

        return res.status(500).json({
            error: __('nickname.get_list_nickname_failed'),
        });
    }
};
