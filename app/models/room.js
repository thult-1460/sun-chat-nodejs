const mongoose = require('mongoose');
const config = require('../../config/config');

mongoose.set('useFindAndModify', false);

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
    type: { type: Number, default: config.ROOM_TYPE.GROUP_CHAT }, //0: group chat - 1: direct chat
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

  getListRoomByUserId: function({ userId, filter_type, limit, page = 0 }) {
    let list_filter_type_chat = [],
      default_quantity_unread = config.LIMIT_MESSAGE.COUNT_UNREAD,
      filter_unread = { $match: { quantity_unread: { $gt: 0 } } },
      filter_pinned = { $match: { 'last_msg_id_reserve.marked': true } },
      filter_group = { 'members.user': mongoose.Types.ObjectId(userId), type: config.ROOM_TYPE.GROUP_CHAT },
      filter_direct = { 'members.user': { $ne: mongoose.Types.ObjectId(userId) }, type: config.ROOM_TYPE.DIRECT_CHAT };

    filter_type = parseInt(filter_type);

    let query = [
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
      {
        $addFields: {
          message_able: {
            $filter: {
              input: '$messages',
              as: 'mes',
              cond: {
                $or: [
                  { $eq: ['$$mes.deletedAt', null] },
                  { $eq: ['$$mes._id', '$last_msg_id_reserve.last_message_id'] },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          message_limit: { $slice: ['$message_able', default_quantity_unread] },
        },
      },
      { $unwind: '$members' },
    ];

    if (filter_type === config.FILTER_TYPE.LIST_ROOM.GROUP) {
      list_filter_type_chat.push(filter_group);
    } else if (filter_type === config.FILTER_TYPE.LIST_ROOM.DIRECT) {
      list_filter_type_chat.push(filter_direct);
    } else {
      list_filter_type_chat = [filter_group, filter_direct];
    }

    query.push({
      $match: {
        $or: list_filter_type_chat,
      },
    });

    if (filter_type === config.FILTER_TYPE.LIST_ROOM.PINNED) {
      query.push(filter_pinned);
    }

    query.push(
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
          last_created_msg: { $max: '$messages.createdAt' },
          marked: '$last_msg_id_reserve.marked',
          'members.user': 1,
          'members.user_info._id': 1,
          'members.user_info.avatar': 1,
          'members.user_info.name': 1,
          'members.user_info.username': 1,
          'members.last_message_id': '$last_msg_id_reserve.last_message_id',
          quantity_unread: {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $indexOfArray: ['$message_limit._id', '$last_msg_id_reserve.last_message_id'] }, -1] },
                  { $ne: ['$last_msg_id_reserve.last_message_id', null] },
                ],
              },
              then: { $indexOfArray: ['$message_limit._id', '$last_msg_id_reserve.last_message_id'] },
              else: { $size: '$message_limit' },
            },
          },
        },
      }
    );

    if (filter_type === config.FILTER_TYPE.LIST_ROOM.UNREAD) {
      query.push(filter_unread);
    }

    query.push({
      $sort: {
        marked: -1,
        last_created_msg: -1,
      },
    });

    return this.aggregate(query)
      .limit(limit)
      .skip(limit * page)
      .exec();
  },

  getQuantityRoomsByUserId: function({ _id, filter_type }) {
    let list_filter_type_chat = [],
      filter_unread = { $match: { quantity_unread: { $gt: 0 } } },
      filter_pinned = { $match: { 'last_msg_id_reserve.marked': true } },
      filter_group = { 'members.user': mongoose.Types.ObjectId(_id), type: config.ROOM_TYPE.GROUP_CHAT },
      filter_direct = { 'members.user': { $ne: mongoose.Types.ObjectId(_id) }, type: config.ROOM_TYPE.DIRECT_CHAT };

    filter_type = parseInt(filter_type);

    let query = [
      {
        $match: { 'members.user': mongoose.Types.ObjectId(_id) },
      },
    ];

    if (filter_type === config.FILTER_TYPE.LIST_ROOM.GROUP) {
      list_filter_type_chat.push(filter_group);
    } else if (filter_type === config.FILTER_TYPE.LIST_ROOM.DIRECT) {
      list_filter_type_chat.push(filter_direct);
    } else {
      list_filter_type_chat = [filter_group, filter_direct];
    }

    query.push({
      $match: {
        $or: list_filter_type_chat,
      },
    });

    if ([config.FILTER_TYPE.LIST_ROOM.PINNED, config.FILTER_TYPE.LIST_ROOM.UNREAD].indexOf(filter_type) >= 0) {
      query.push({
        $addFields: {
          last_msg_id_reserve: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$members',
                  as: 'mem',
                  cond: { $eq: ['$$mem.user', mongoose.Types.ObjectId(_id)] },
                },
              },
              0,
            ],
          },
        },
      });
      query.push(filter_pinned);
    }

    if (filter_type === config.FILTER_TYPE.LIST_ROOM.UNREAD) {
      query.push(
        {
          $addFields: {
            message_able: {
              $filter: {
                input: '$messages',
                as: 'mes',
                cond: { $eq: ['$$mes.deletedAt', null] },
              },
            },
          },
        },
        {
          $addFields: {
            quantity_unread: { $gte: [{ $first: '$message_able._id' }, '$last_msg_id_reserve.last_message_id'] },
          },
        }
      );
      query.push(filter_unread);
    }

    query.push({
      $count: 'result',
    });

    return this.aggregate(query).exec();
  },

  getMembersOfRoom($roomId) {
    return this.aggregate([
      { $match: { _id: mongoose.Types.ObjectId($roomId) } },
      { $unwind: '$members' },
      { $match: { 'members.deletedAt': null } },
      {
        $lookup: {
          from: 'users',
          localField: 'members.user',
          foreignField: '_id',
          as: 'members.user',
        },
      },
      {
        $project: {
          'members.role': 1,
          _id: 0,
          user: { $arrayElemAt: ['$members.user', 0] },
        },
      },
      {
        $project: {
          members: 1,
          'user._id': 1,
          'user.name': 1,
          'user.email': 1,
          'user.avatar': 1,
        },
      },
    ]);
  },

  deleteRoom: function(userId, roomId) {
    return this.findOneAndUpdate(
      {
        _id: roomId,
        deletedAt: null,
        members: { $elemMatch: { user: userId, role: config.MEMBER_ROLE.ADMIN } },
      },
      { $set: { deletedAt: Date.now() } }
    ).exec();
  },
};

module.exports = mongoose.model('Room', RoomSchema);
