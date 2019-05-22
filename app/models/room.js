const mongoose = require('mongoose');
const config = require('../../config/config');

const Schema = mongoose.Schema;

// Setup schema
const Messages = new Schema(
  {
    content: { type: String },
    user: { type: Schema.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const Members = new Schema(
  {
    user: { type: Schema.ObjectId, ref: 'User' },
    role: { type: Number, default: config.MEMBER_ROLE.MEMBER }, //0: admin - 1: member - 2: read-only
    last_message_id: { type: Schema.ObjectId, ref: 'Messages' },
    marked: { type: Boolean, default: false },
    room_group: { type: Schema.ObjectId, ref: 'Room_group' },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const Tasks = new Schema(
  {
    content: { type: String },
    due: { type: Date, default: null },
    assignees: { type: Schema.ObjectId, ref: 'User' },
    done: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const Files = new Schema(
  {
    name: { type: String },
    path: { type: String },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const RoomSchema = new Schema(
  {
    name: { type: String },
    desc: { type: String },
    type: { type: Number, defauls: config.ROOM_TYPE.GROUP_CHAT }, //0: group chat - 1: direct chat
    invitation_code: { type: String },
    invitation_type: { type: Number, default: config.INVITATION_TYPE.NOT_NEED_APPROVAL }, //0: don't need admin approves - 1: need admin approves
    avatar_url: { type: String },
    members: [Members],
    messages: [Messages],
    tasks: [Tasks],
    files: [Files],
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

RoomSchema.statics = {
  load: function(options, cb) {
    options.select = options.select || 'name';
    return this.findOne(options.criteria)
      .select(options.select)
      .exec(cb);
  },

  getListRoomByUserId: function({ limit, page = 0, userId }) {
    return this.aggregate([
      { $match: { 'members.user': mongoose.Types.ObjectId(userId) } },
      {
        $addFields: {
          last_msg_id_reserve: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$members',
                  as: 'mem',
                  cond: { $eq: ['$$mem.user', mongoose.Types.ObjectId(userId)] },
                },
              },
              0,
            ],
          },
        },
      },
      { $unwind: '$members' },
      {
        $match: {
          $or: [
            { 'members.user': mongoose.Types.ObjectId(userId), type: config.ROOM_TYPE.GROUP_CHAT },
            { 'members.user': { $ne: mongoose.Types.ObjectId(userId) }, type: config.ROOM_TYPE.DIRECT_CHAT },
          ],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members.user',
          foreignField: '_id',
          as: 'members.user_info',
        },
      },
      {
        $project: {
          name: {
            $cond: {
              if: { $eq: ['$type', config.ROOM_TYPE.GROUP_CHAT] },
              then: '$name',
              else: { $arrayElemAt: ['$members.user_info.name', 0] },
            },
          },
          avatar_url: {
            $cond: {
              if: { $eq: ['$type', config.ROOM_TYPE.GROUP_CHAT] },
              then: '$avatar_url',
              else: { $arrayElemAt: ['$members.user_info.avatar', 0] },
            },
          },
          type: 1,
          messages: 1,
          last_created_msg: { $max: '$messages.createdAt' },
          marked: '$members.marked',
          'members.user': 1,
          'members.user_info._id': 1,
          'members.user_info.avatar': 1,
          'members.user_info.name': 1,
          'members.user_info.username': 1,
          'members.last_message_id': '$last_msg_id_reserve.last_message_id',
          quantity_unread: {
            $reduce: {
              input: '$messages',
              initialValue: 0,
              in: {
                $sum: [
                  '$$value',
                  {
                    $cond: {
                      if: { $cmp: ['$$this._id', '$last_msg_id_reserve.last_message_id'] },
                      then: 0,
                      else: 1,
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $sort: {
          marked: -1,
          last_created_msg: -1,
        },
      },
    ])
      .limit(limit)
      .skip(limit * page)
      .exec();
  },

  getQuantityRoomsByUserId: function(userId) {
    return this.find({
      'members.user': userId,
    })
      .count()
      .exec();
  },
};

module.exports = mongoose.model('Room', RoomSchema);
