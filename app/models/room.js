const mongoose = require('mongoose');

const Schema = mongoose.Schema;
// Setup schema
const Messages = new Schema({
    content: { type: String },
    user: { type: Schema.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true,
});

const Members = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    role: { type: Number, default: 1 }, //0: admin - 1: member - 2: read-only
    last_message_id: { type: Number, default: null },
    marked: { type: Boolean, default: false },
    room_group: { type: Schema.ObjectId, ref: 'Room_group' },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true,
});

const Tasks = new Schema({
    content: { type: String },
    due: { type: Date, default: null },
    assignees: { type: Schema.ObjectId, ref: 'User' },
    done: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true,
});

const Files = new Schema({
    name: { type: String },
    path: { type: String },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true,
});

const RoomSchema = new Schema({
    name: { type: String },
    desc: { type: String },
    type: { type: Number, defauls: 0 }, //0: group chat - 1: direct chat
    invitation_code: { type: String },
    invitation_type: { type: Number, default: 1 }, //0: need admin approves - 1: don't need admin approves
    avatar_url: { type: String },
    members: [Members],
    messages: [Messages],
    tasks: [Tasks],
    files: [Files],
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true,
});

RoomSchema.statics = {
    load: function(options, cb) {
        options.select = options.select || 'name';
        return this.findOne(options.criteria)
            .select(options.select)
            .exec(cb);
    },
}

module.exports = mongoose.model('Room', RoomSchema);
