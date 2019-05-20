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
};

module.exports = mongoose.model('Room', RoomSchema);
