const authValidate = {
  name: {
    minLength: 6,
    maxLength: 20,
  },
  username: {
    minLength: 6,
    maxLength: 20,
  },
  email: {
    maxLength: 255,
  },
  password: {
    minLength: 6,
    maxLength: 20,
  },
};

const roomValidate = {
  invitation_code: {
    minLength: 10,
    maxLength: 50,
  },
  name: {
    minLength: 10,
    maxLength: 50,
  },
  text_search: {
    minLength: 3,
  },
};

const avatarValidate = {
  IMG_SIZE: 5, //MB
  IMG_TYPES: ['image/png', 'image/jpeg', 'image/gif'],
};

module.exports = {
  authValidate,
  roomValidate,
  avatarValidate,
};
