'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * NickName Schema
 */

const NicknameSchema = new Schema(
  {
    owner: { type: Schema.ObjectId, ref: 'User', },
    user_id: { type: Schema.ObjectId, ref: 'User', },
    nickname: {
      type: String,
      default: '',
      required: true,
    },
    room_id: { type: Schema.ObjectId, ref: 'Room', default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

NicknameSchema.statics = {
  /**
   * Load
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  getList: function (userId, roomId) {
    return this.aggregate([
      {
        $match: {
          owner: mongoose.Types.ObjectId(userId),
          deletedAt: null,
          room_id: { $in: [mongoose.Types.ObjectId(roomId), null] }
        }
      },
      {
        $group: {
          _id: '$user_id',
          owner: { $first: '$owner' },
          user_id: { $first: '$user_id' },
          room_id: { $push: '$room_id' },
          nickname: { $push: '$nickname' }
        }
      },
      {
        $project: {
          user_id: 1,
          nickname: {
            $arrayElemAt: [
              '$nickname',
              {
                $cond: {
                  if: { $in: [mongoose.Types.ObjectId(roomId), '$nickname'] },
                  then: { $indexOfArray: ['$room_id', mongoose.Types.ObjectId(roomId)] },
                  else: 0,
                }
              }
            ]
          },
        }
      }
    ]);
  }
};

module.exports = mongoose.model('NickName', NicknameSchema);
