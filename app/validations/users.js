const { checkName, checkUsername, checkEmail, checkPassword } = require('./actions/register');
const { checkCurrentPassword, checkNewPassword, checkConfirmPassword } = require('./actions/changePassword');
const { checkEmail: checkEmailResetPassword } = require('./actions/reset_password');
const { checkNameEdit, checkUsernameEdit, checkEmailEdit } = require('./actions/profile');

exports.validate = (type, app) => {
  switch (type) {
    case 'register': {
      return [checkName(), checkUsername(), checkEmail(), checkPassword()];
    }

    case 'changePassword': {
      return [checkCurrentPassword(), checkNewPassword(), checkConfirmPassword()];
    }

    case 'resetPassword': {
      return [checkPassword()];
    }

    case 'sendMailResetPassword': {
      return [checkEmailResetPassword()];
    }

    case 'update': {
      return [checkNameEdit(), checkUsernameEdit(), checkEmailEdit()];
    }
  }
};
