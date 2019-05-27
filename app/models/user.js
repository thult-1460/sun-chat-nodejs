'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');
const config = require('../../config/config');
const Schema = mongoose.Schema;
const oAuthTypes = ['github', 'twitter', 'google', 'linkedin'];
const Room = require('./room');
/**
 * User Schema
 */

const UserSchema = new Schema(
  {
    name: {
      type: String,
      default: '',
      required: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      unique: true,
      required: true,
    },
    username: {
      type: String,
      default: '',
      unique: true,
      required: true,
    },
    full_address: {
      type: String,
      default: '',
    },
    phone_number: {
      type: String,
      default: '',
    },
    provider: {
      type: String,
      default: '',
    },
    hashed_password: {
      type: String,
      default: '',
      required: true,
    },
    salt: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: false,
    },
    active_token: {
      type: String,
    },
    active_token_expire: {
      type: Date,
      default: moment().add(process.env.ACTIVE_TOKEN_EXPIRE_TIME, 'days'),
    },
    twitter: {
      type: String,
      default: '',
    },
    github: {
      type: String,
      default: '',
    },
    google: {
      type: String,
      default: '',
    },
    linkedin: {},
    requested_in_comming: [
      {
        type: Schema.ObjectId,
        ref: 'User',
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    reset_token: {
      type: String,
      default: '',
    },
    reset_token_expire: {
      type: Date,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Virtuals
 */
const validatePresenceOf = value => value && value.length;

/**
 * Virtuals
 */

UserSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

/**
 * Validations
 */

/**
 * Pre-save hook
 */

UserSchema.pre('save', function(next) {
  if (!this.isNew) return next();

  if (!validatePresenceOf(this.password) && !this.skipValidation()) {
    next(new Error('Invalid password'));
  } else {
    next();
  }
});

/**
 * Methods
 */

UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt: function() {
    return Math.round(new Date().valueOf() * Math.random()) + '';
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */

  encryptPassword: function(password) {
    if (!password) return '';
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex');
    } catch (err) {
      return '';
    }
  },

  /**
   * Validation is not required if using OAuth
   */

  skipValidation: function() {
    return ~oAuthTypes.indexOf(this.provider);
  },

  updatePassword: function(newPassword) {
    try {
      this.hashed_password = this.encryptPassword(newPassword);
      this.save();
    } catch (err) {
      throw new Error(err);
    }
  },
  /**
   * Reset password
   */
  resetPassword: function(password) {
    try {
      this.password = password;
      this.reset_token = '';
      this.reset_token_expire = '';

      return this.save();
    } catch (err) {
      throw new Error(err.toString());
    }
  },
};

/**
 * Statics
 */

UserSchema.statics = {
  /**
   * Load
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  load: function(options, cb) {
    options.select = options.select || 'name username hashed_password salt reset_token_expire email active';

    return this.findOne(options.criteria)
      .select(options.select)
      .exec(cb);
  },

  getMyContactRequest: function(userId, options) {
    let limit = options.limit;
    const page = options.page || 0;

    return this.find(
      {
        _id: userId,
      },
      { name: 1, requested_in_comming: { $slice: [limit * page, limit] } }
    )
      .populate({
        path: 'requested_in_comming',
        select: { avatar: 1, name: 1, _id: 1, email: 1 },
      })
      .exec();
  },

  getAllContactRequest: function(userId) {
    return this.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          number_of_contact: {
            $cond: { if: { $isArray: '$requested_in_comming' }, then: { $size: '$requested_in_comming' }, else: 0 },
          },
        },
      },
    ]);
  },

  updateInfo: function(options) {
    try {
      this.updateOne(options.criteria, options.data);

      return true;
    } catch (err) {
      return false;
    }
  },

  acceptRequest: function(userId, requestUserIds) {
    try {
      for (let i = 0; i < requestUserIds.length; i++) {
        let rooms = new Room({ type: config.ROOM_TYPE.DIRECT_CHAT });
        rooms.members.push(
          { user: userId, role: config.MEMBER_ROLE.MEMBER },
          { user: requestUserIds[i], role: config.MEMBER_ROLE.MEMBER }
        );
        rooms.save(function(err) {
          if (err) throw new Error(__('contact.accept.failed'));
        });
      }

      return this.update({ _id: userId }, { $pullAll: { requested_in_comming: requestUserIds } });
    } catch (err) {
      throw new Error(__('contact.accept.failed'));
    }
  },

  getListContacts: function({ limit, page = 0, userId }) {
    return Room.find(
      {
        type: config.ROOM_TYPE.DIRECT_CHAT,
        'members.user': userId,
        deletedAt: null,
      },
      {
        'members.role': 0,
        'members.marked': 0,
        'members.deletedAt': 0,
        'members._id': 0,
        'members.last_message_id': 0,
        'members.createdAt': 0,
        'members.updatedAt': 0,
        members: { $elemMatch: { user: { $ne: userId } } },
      }
    )
      .populate('members.user', '_id name email username full_address phone_number twitter github google avatar ')
      .limit(limit)
      .skip(limit * page)
      .exec();
  },

  getContactCount: function(userId) {
    return Room.find({ type: config.ROOM_TYPE.DIRECT_CHAT, deletedAt: null, 'members.user': userId })
      .count()
      .exec();
  },

  deleteContact: function(userId, contactId) {
    return Room.findOneAndUpdate(
      {
        type: config.ROOM_TYPE.DIRECT_CHAT,
        deletedAt: null,
        'members.user': userId,
        members: { $elemMatch: { user: contactId } },
      },
      { $set: { deletedAt: Date.now() } }
    );
  },

  getSendRequestMakeFriend: function(userId) {
    return this.find({ requested_in_comming: { $in: [userId] } }, { _id: 1 }).exec();
  },

  getListRequestedMakeFriend: function(userId) {
    return this.findOne({ _id: userId }, { requested_in_comming: 1, _id: 0 }).exec();
  },

  getSearchContactByName: function(options) {
    options.select = options.select || '_id name username email avatar';
    let regexText = `.*${options.searchText}.*`;
    let regexEmail = `.*${options.searchText}.*@sun-asterisk\.com`;
    let limit = options.limit || '';
    let page = options.page || 0;

    return this.find({ _id: { $nin: options.listUserIdsIgnore } })
      .or([
        { name: { $regex: regexText, $options: '$xi' } },
        { username: { $regex: regexText, $options: '$xi' } },
        { email: { $regex: regexEmail, $options: '$xi' } },
      ])
      .limit(limit)
      .skip(limit * page)
      .select(options.select)
      .exec();
  },

  getListContactIds: function({ userId }) {
    return Room.find(
      {
        type: config.ROOM_TYPE.DIRECT_CHAT,
        'members.user': userId,
        deleteAt: null,
      },
      { members: { $elemMatch: { user: { $ne: userId } } }, _id: 0 }
    ).exec();
  },

  /**
   * Update Send Request Friend
   */
  updateRequestFriend: function(userIdReceive, userIdSend) {
    try {
      return this.update({ _id: userIdReceive }, { $push: { requested_in_comming: userIdSend } });
    } catch (err) {
      throw new Error(err);
    }
  },
};

module.exports = mongoose.model('User', UserSchema);
