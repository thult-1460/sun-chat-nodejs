const roomConfig = {
  IMG_MAX_SIZE: 5,
  IMG_TYPES: ['image/png', 'image/jpeg', 'image/gif'],
  INVITATION_URL:  window.location.origin + '/r/',
  INVITATION_TYPE: {
    NOT_NEED_APPROVAL: 0,
    NEED_APPROVAL: 1
  },
  LIMIT_CONTACT: 100,
  CHAR_MIN: 10,
  CHAR_MAX: 50,
};

module.exports = {
  roomConfig,
};
