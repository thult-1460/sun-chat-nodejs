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
    pinned: { type: Boolean, default: false },
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
    invitation_code: { type: String, unique: true, default: null },
    invitation_type: { type: Number, default: config.INVITATION_TYPE.NOT_NEED_APPROVAL }, //0: don't need admin approves - 1: need admin approves
    avatar: { type: String },
    members: [Members],
    messages: [Messages],
    tasks: [Tasks],
    files: [Files],
    incoming_requests: [
      {
        type: Schema.ObjectId,
        ref: 'User',
      },
    ],
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

  getListRoomByUserId: function({ userId, filter_type = 0, limit, page = 0 }) {
    let list_filter_type_chat = [],
      default_quantity_unread = config.LIMIT_MESSAGE.COUNT_UNREAD,
      filter_unread = { $match: { quantity_unread: { $gt: 0 } } },
      filter_pinned = { $match: { 'last_msg_id_reserve.pinned': true } },
      filter_group = { 'members.user': mongoose.Types.ObjectId(userId), type: config.ROOM_TYPE.GROUP_CHAT },
      filter_direct = { 'members.user': { $ne: mongoose.Types.ObjectId(userId) }, type: config.ROOM_TYPE.DIRECT_CHAT },
      filter_self = { 'members.user': mongoose.Types.ObjectId(userId), type: config.ROOM_TYPE.SELF_CHAT };

    filter_type = parseInt(filter_type);

    let query = [
      { $match: { deletedAt: null, 'members.user': mongoose.Types.ObjectId(userId) } },
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
          message_limit: { $slice: ['$message_able', -1 * default_quantity_unread] },
        },
      },
      { $unwind: '$members' },
    ];

    if (filter_type === config.FILTER_TYPE.LIST_ROOM.GROUP) {
      list_filter_type_chat.push(filter_group);
    } else if (filter_type === config.FILTER_TYPE.LIST_ROOM.DIRECT) {
      list_filter_type_chat.push(filter_direct);
    } else if (filter_type === config.FILTER_TYPE.LIST_ROOM.SELF) {
      list_filter_type_chat.push(filter_self);
    } else {
      list_filter_type_chat = [filter_group, filter_direct, filter_self];
    }

    query.push({
      $match: {
        'members.deletedAt': null,
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
              if: { $in: ['$type', [config.ROOM_TYPE.GROUP_CHAT, config.ROOM_TYPE.SELF_CHAT]] },
              then: '$name',
              else: { $arrayElemAt: ['$members.user_info.name', 0] },
            },
          },
          avatar: {
            $cond: {
              if: { $eq: ['$type', config.ROOM_TYPE.GROUP_CHAT] },
              then: { $concat: [`/${config.DIR_UPLOAD_FILE.split('/').slice(2)[0]}/`, '$avatar'] },
              else: { $arrayElemAt: ['$members.user_info.avatar', 0] },
            },
          },
          type: 1,
          last_created_msg: { $max: '$messages.createdAt' },
          pinned: '$last_msg_id_reserve.pinned',
          quantity_unread: {
            $cond: {
              if: {
                $and: [
                  { $gt: [{ $indexOfArray: ['$message_limit._id', '$last_msg_id_reserve.last_message_id'] }, -1] },
                  { $ne: ['$last_msg_id_reserve.last_message_id', null] },
                ],
              },
              then: {
                $size: {
                  $slice: [
                    '$message_limit._id',
                    { $add: [{ $indexOfArray: ['$message_limit._id', '$last_msg_id_reserve.last_message_id'] }, 1] },
                    default_quantity_unread,
                  ],
                },
              },
              else: { $size: '$message_limit' },
            },
          },
        },
      }
    );

    if (filter_type === config.FILTER_TYPE.LIST_ROOM.UNREAD) {
      query.push(filter_unread);
    }

    query.push(
      {
        $sort: {
          pinned: -1,
          last_created_msg: -1,
        },
      },
      { $skip: limit * page },
      {
        $limit: 20,
      }
    );

    return this.aggregate(query).exec();
  },

  getQuantityRoomsByUserId: function(_id, filter_type = 0) {
    let list_filter_type_chat = [],
      filter_unread = { $match: { quantity_unread: true } },
      filter_pinned = { $match: { 'last_msg_id_reserve.pinned': true } },
      filter_group = { type: config.ROOM_TYPE.GROUP_CHAT },
      filter_direct = { type: config.ROOM_TYPE.DIRECT_CHAT },
      filter_self = { type: config.ROOM_TYPE.SELF_CHAT };

    filter_type = parseInt(filter_type);

    let query = [
      {
        $match: { deletedAt: null, 'members.user': mongoose.Types.ObjectId(_id) },
      },
      { $unwind: '$members' },
    ];

    if (filter_type === config.FILTER_TYPE.LIST_ROOM.GROUP) {
      list_filter_type_chat.push(filter_group);
    } else if (filter_type === config.FILTER_TYPE.LIST_ROOM.DIRECT) {
      list_filter_type_chat.push(filter_direct);
    } else if (filter_type === config.FILTER_TYPE.LIST_ROOM.SELF) {
      list_filter_type_chat.push(filter_self);
    } else {
      list_filter_type_chat = [filter_group, filter_direct, filter_self];
    }

    query.push({
      $match: {
        'members.user': mongoose.Types.ObjectId(_id),
        'members.deletedAt': null,
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

      if (filter_type === config.FILTER_TYPE.LIST_ROOM.PINNED) {
        query.push(filter_pinned);
      }
    }

    if (filter_type === config.FILTER_TYPE.LIST_ROOM.UNREAD) {
      query.push({
        $addFields: {
          message_able: {
            $filter: {
              input: '$messages',
              as: 'mes',
              cond: { $eq: ['$$mes.deletedAt', null] },
            },
          },
        },
      });

      query.push({
        $addFields: {
          quantity_unread: {
            $gte: [{ $arrayElemAt: ['$message_able._id', 0] }, '$last_msg_id_reserve.last_message_id'],
          },
        },
      });

      query.push(filter_unread);
    }
    query.push({
      $count: 'result',
    });

    return this.aggregate(query).exec();
  },

  getRoomsBySubName: function({ userId, sub_name }) {
    return this.aggregate([
      { $match: { deletedAt: null, 'members.user': mongoose.Types.ObjectId(userId) } },
      { $unwind: '$members' },
      {
        $match: {
          'members.deletedAt': null,
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
        $addFields: {
          name: {
            $cond: {
              if: { $in: ['$type', [config.ROOM_TYPE.GROUP_CHAT, config.ROOM_TYPE.SELF_CHAT]] },
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
        },
      },
      {
        $match: { name: { $regex: '^.*' + sub_name + '.*$', $options: 'i' } },
      },
      {
        $project: {
          name: 1,
          avatar_url: 1,
        },
      },
    ]);
  },

  getMembersOfRoom(roomId) {
    return this.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(roomId) } },
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
          'user.username': 1,
          'user.email': 1,
          'user.avatar': 1,
          'user.phone_number': 1,
          'user.full_address': 1,
          'user.twitter': 1,
          'user.github': 1,
          'user.google': 1,
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

  getRoomInfoByInvitateCode(invitationCode) {
    return this.findOne({ invitation_code: invitationCode }, 'name avatar_url');
  },

  addJoinRequest(roomId, userId) {
    return this.updateOne(
      {
        _id: roomId,
      },
      {
        $push: { incoming_requests: userId },
      }
    );
  },

  addNewMember(roomId, userId, lastMsgId) {
    let memberObject = {
      deletedAt: null,
      role: config.MEMBER_ROLE.MEMBER,
      pinned: false,
      user: userId,
      last_message_id: lastMsgId,
    };

    return this.updateOne(
      {
        _id: roomId,
        deletedAt: null,
      },
      {
        $push: { members: memberObject },
      }
    );
  },

  deleteMember: function(memberId, roomId) {
    return this.findOneAndUpdate(
      {
        _id: roomId,
        deletedAt: null,
        members: { $elemMatch: { user: memberId, deletedAt: null } },
      },
      { $set: { 'members.$.deletedAt': Date.now() } }
    ).exec();
  },

  getInforOfRoom: function(roomId) {
    return this.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(roomId), deletedAt: null } },
      {
        $addFields: {
          members: {
            $filter: {
              input: '$members',
              as: 'member_not_delete',
              cond: { $eq: ['$$member_not_delete.deletedAt', null] },
            },
          },
        },
      },
      {
        $addFields: {
          representative_members: { $slice: ['$members', config.ROOM.LIMIT_REPRESENTATIVE_MEMBER] },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'representative_members.user',
          foreignField: '_id',
          as: 'members_info',
        },
      },
      {
        $project: {
          name: 1,
          desc: 1,
          type: 1,
          avatar: {
            $concat: [`/${config.DIR_UPLOAD_FILE.split('/').slice(2)[0]}/`, '$avatar'],
          },
          invitation_code: 1,
          invitation_type: 1,
          'members_info._id': 1,
          'members_info.name': 1,
          'members_info.email': 1,
          'members_info.avatar': 1,
          number_of_members: {
            $cond: { if: { type: config.ROOM_TYPE.GROUP_CHAT }, then: { $size: '$members' }, else: 0 },
          },
        },
      },
    ]);
  },

  getRequestJoinRoom: function(roomId, options) {
    let limit = options.limit;
    const page = options.page || 0;

    return this.find(
      {
        _id: roomId,
      },
      { name: 1, incoming_requests: { $slice: [limit * page, limit] } }
    )
      .populate({
        path: 'incoming_requests',
        select: { avatar: 1, name: 1, _id: 1, email: 1 },
      })
      .exec();
  },

  getNumberOfRequest: async function(roomId) {
    const room = await this.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(roomId) } },
      {
        $project: {
          number_of_requests: {
            $cond: { if: { $isArray: '$incoming_requests' }, then: { $size: '$incoming_requests' }, else: 0 },
          },
        },
      },
    ]);

    return room[0]['number_of_requests'];
  },

  checkAdmin: async function(roomId, userId) {
    let isAdmin = false;

    await this.findOne({
      _id: roomId,
      members: { $elemMatch: { user: userId, role: config.MEMBER_ROLE.ADMIN } },
    })
      .then(room => {
        if (room != null) isAdmin = true;
      })
      .catch(err => {
        channel.error(__('room.not_admin'));
      });

    return isAdmin;
  },

  rejectRequests: async function(roomId, requestIds) {
    return this.updateOne(
      {
        _id: roomId,
      },
      {
        $pull: {
          incoming_requests: {
            $in: requestIds,
          },
        },
      }
    );
  },

  acceptRequest: async function(roomId, requestIds) {
    let members = [];
    const lastMsgId = await this.getLastMsgId(roomId);

    requestIds.map(id => {
      members.push({
        role: config.MEMBER_ROLE.MEMBER,
        marked: true,
        deleteAt: null,
        user: id,
        last_message_id: lastMsgId,
      });
    });

    return this.update(
      { _id: roomId },
      {
        $push: {
          members: members,
        },
        $pull: {
          incoming_requests: {
            $in: requestIds,
          },
        },
      }
    );
  },

  getLastMsgId: async function(roomId) {
    const room = await this.findOne(
      {
        _id: roomId,
      },
      { messages: { $slice: -1 }, invitation_type: 1 }
    );

    return room.messages[0]._id;
  },

  getPinnedRoom: function(roomId, userId) {
    return this.findOne(
      {
        _id: roomId,
        deletedAt: null,
      },
      {
        members: { $elemMatch: { user: { $eq: userId }, deletedAt: null } },
      }
    ).exec();
  },

  pinnedRoom: function(roomId, userId, pinned) {
    return this.findOneAndUpdate(
      {
        _id: roomId,
        deletedAt: null,
        members: { $elemMatch: { user: userId, deletedAt: null } },
      },
      { $set: { 'members.$.pinned': pinned } }
    ).exec();
  },

  loadMessages: async function(roomId, userId, page) {
    return this.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(roomId), deletedAt: null } },
      { $unwind: '$members' },
      { $match: { 'members.user': mongoose.Types.ObjectId(userId), 'members.deletedAt': null } },
      {
        $addFields: {
          message_able: {
            $filter: {
              input: '$messages',
              as: 'mes',
              cond: {
                $or: [{ $eq: ['$$mes.deletedAt', null] }, { $eq: ['$$mes._id', '$user.last_message_id'] }],
              },
            },
          },
        },
      },
      {
        $addFields: {
          index_of_message: {
            $add: [
              { $indexOfArray: ['$message_able._id', '$members.last_message_id'] },
              page * config.LIMIT_MESSAGE.NEXT_MESSAGE,
            ],
          },
        },
      },
      {
        $addFields: {
          messages: {
            $cond: {
              if: {
                $gte: ['$index_of_message', 0],
              },
              then: {
                $slice: ['$message_able', '$index_of_message', config.LIMIT_MESSAGE.NEXT_MESSAGE],
              },
              else: {
                $cond: {
                  if: {
                    $lt: [{ $abs: '$index_of_message' }, config.LIMIT_MESSAGE.NEXT_MESSAGE],
                  },
                  then: {
                    $slice: [
                      '$message_able',
                      {
                        $add: ['$index_of_message', config.LIMIT_MESSAGE.NEXT_MESSAGE],
                      },
                    ],
                  },
                  else: '[]',
                },
              },
            },
          },
        },
      },
      { $unwind: '$messages' },
      {
        $lookup: {
          from: 'users',
          localField: 'messages.user',
          foreignField: '_id',
          as: 'messages.user_info',
        },
      },
      {
        $addFields: {
          'messages.user_info': { $arrayElemAt: ['$messages.user_info', 0] },
        },
      },
      {
        $replaceRoot: { newRoot: '$messages' },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          updatedAt: 1,
          'user_info._id': 1,
          'user_info.name': 1,
          'user_info.avatar': 1,
        },
      },
    ]);
  },

  changeRoleMember: function(roomId, members) {
    return this.findById(roomId).then(function(room) {
      for (let i in members) {
        let index = room.members.findIndex(member => member.user == members[i].memberId);

        if (index !== -1) {
          room.members[index].role = members[i].nextRole;
        }
      }
      room.save();
    });
  },

  deleteMessage: function(messageId, roomId) {
    return this.findOneAndUpdate(
      {
        _id: roomId,
        deletedAt: null,
        messages: { $elemMatch: { _id: messageId } },
      },
      { $set: { 'messages.$.deletedAt': Date.now() } }
    ).exec();
  },

  storeMessage: async function(roomId, userId, content) {
    const msgObject = {
      content: content,
      user: userId,
      deletedAt: null,
    };

    return this.findOneAndUpdate(
      { _id: roomId },
      {
        $push: {
          messages: msgObject,
        },
      },
      { new: true }
    );
  },

  updateMessage: async function(roomId, userId, msgId, content) {
    return this.updateOne(
      {
        _id: roomId,
        messages: { $elemMatch: { _id: msgId } },
      },
      { $set: { 'messages.$.content': content, updatedAt: Date.now() } }
    );
  },

  getMessageInfo: async function(roomId, messageId) {
    const message = await this.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(roomId) } },
      { $unwind: '$messages' },
      { $match: { 'messages._id': mongoose.Types.ObjectId(messageId), 'messages._id.deletedAt': null } },
      {
        $lookup: {
          from: 'users',
          localField: 'messages.user',
          foreignField: '_id',
          as: 'messages.user',
        },
      },

      {
        $addFields: {
          'messages.user_info': {
            $arrayElemAt: ['$messages.user', 0],
          },
        },
      },
      {
        $project: {
          'messages._id': 1,
          'messages.content': 1,
          'messages.createdAt': 1,
          'messages.updatedAt': 1,
          'messages.user_info._id': 1,
          'messages.user_info.name': 1,
          'messages.user_info.avatar': 1,
        },
      },
    ]);

    return message.length > 0 ? message[0].messages : {};
  },

  getRoomMyChatId: function(userId) {
    return this.find(
      {
        'members.user': userId,
        type: config.ROOM_TYPE.SELF_CHAT,
      },
      {
        _id: 1,
      }
    ).exec();
  },

  createMyChat: function(userId) {
    return this.insertMany([
      {
        name: 'My Chat',
        type: config.ROOM_TYPE.SELF_CHAT,
        members: [{ user: userId, role: config.MEMBER_ROLE.MEMBER }],
      },
    ]);
  },
};

module.exports = mongoose.model('Room', RoomSchema);
