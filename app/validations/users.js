const { checkName, checkUsername, checkEmail, checkPassword } = require('./actions/register');
const { checkCurrentPassword, checkNewPassword, checkConfirmPassword } = require('./actions/changePassword');
const { checkEmail: checkEmailResetPassword } = require('./actions/reset_password');
const { check } = require('express-validator/check');

exports.validate = (type, app) => {
  switch (type) {
    case 'register': {
      return [checkName(), checkUsername(), checkEmail(), checkPassword()];
    }

    case 'change_password': {
      return [checkCurrentPassword(), checkNewPassword(), checkConfirmPassword()];
    }

    case 'resetPassword': {
      return [checkPassword()];
    }

    case 'sendMailResetPassword': {
      return [checkEmailResetPassword()];
    }
  }
};
