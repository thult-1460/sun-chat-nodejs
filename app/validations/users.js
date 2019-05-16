const { checkName, checkUsername, checkEmail, checkPassword } = require('./actions/register');
const { checkCurrentPassword, checkNewPassword, checkConfirmPassword } = require('./actions/changePassword');
const { check } = require('express-validator/check');

exports.validate = (type, app) => {
  switch (type) {
    case 'register': {
      return [checkName(), checkUsername(), checkEmail(), checkPassword()];
    }

    case 'change_password': {
      return [checkCurrentPassword(), checkNewPassword(), checkConfirmPassword()];
    }

    case 'login': {
      return [
        check('email')
          .not()
          .isEmpty()
          .withMessage('Email field is not empty'),
        check('password')
          .not()
          .isEmpty()
          .withMessage('Password is not empty')
          .isLength({ min: 5 })
          .withMessage('Password must be at least 5 chars long'),
      ];
    }
  }
};
