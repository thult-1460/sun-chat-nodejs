'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * NickName Schema
 */

const NickNameSchema = new Schema(
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


module.exports = mongoose.model('NickName', NickNameSchema);
