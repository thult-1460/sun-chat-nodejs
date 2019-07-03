const room = {
  IMG_MAX_SIZE: 5, // MB
  IMG_TYPES: ['image/png', 'image/jpeg', 'image/gif'],
  INVITATION_URL: window.location.origin + '/r/',
  INVITATION_TYPE: {
    NOT_NEED_APPROVAL: 0,
    NEED_APPROVAL: 1,
  },
  LIMIT_CONTACT: 100,
  CHAR_MIN: 10,
  CHAR_MAX: 50,
  INVATATION_STATUS: {
    IN_ROOM: 700,
    JOIN_AS_MEMEBER: 701,
    HAVE_REQUEST_BEFORE: 702,
    CANT_JOIN: 703,
  },
  ROOM_TYPE: {
    GROUP_CHAT: 0,
    DIRECT_CHAT: 1,
    MY_CHAT: 2,
  },
  LIMIT_REPRESENTATIVE_MEMBER: 5,
  MESSAGE_PAGINATE: 10,
  VISIABLE_MSG_TO_LOAD: 4,
  LIMIT_QUANLITY_NEWEST_MSG: 200,
  NUMBER_REQUEST_JOIN_ROOM_OVERFLOW: 99,
  MIN_WIDTH_DESC: 10/100, // ratio %
  MAX_WIDTH_DESC: 37/100, // ratio %
};

module.exports = {
  room,
};
