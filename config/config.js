module.exports = {
  CLIENT_ORIGIN: process.env.NODE_ENV === 'production' ? process.env.CLIENT_ORIGIN : 'http://localhost:3000',
  LIMIT_ITEM_SHOW: 30,
  MEMBER_ROLE: {
    ADMIN: 0,
    MEMBER: 1,
    READ_ONLY: 2,
  },
  ROOM_TYPE: {
    GROUP_CHAT: 0,
    DIRECT_CHAT: 1,
  },
  INVITATION_TYPE: {
    NOT_NEED_APPROVAL: 0,
    NEED_APPROVAL: 1,
    CANNOT_REQUEST: 2,
  },
  FILTER_TYPE: {
    LIST_ROOM: {
      ALL: 0,
      UNREAD: 1,
      PINNED: 2,
      GROUP: 3,
      DIRECT: 4,
    },
  },
  LIMIT_MESSAGE: {
    COUNT_UNREAD: 1000,
  },
};
