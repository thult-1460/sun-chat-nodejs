const { check } = require('express-validator/check');

let checkContent = () => {
  return check('content')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('room.message.validate.content.empty');
    });
};

module.exports = {
  checkContent,
};
