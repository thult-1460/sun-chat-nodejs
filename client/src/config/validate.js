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
const avatarValidate = {
  IMG_MAX_SIZE: 5, // MB
  IMG_TYPES: ['image/png', 'image/jpeg', 'image/gif'],
};

module.exports = {
  authValidate,
  avatarValidate,
};
