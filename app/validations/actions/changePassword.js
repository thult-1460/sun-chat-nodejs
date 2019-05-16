const { check } = require('express-validator/check');
const { authValidate } = require('./../../../config/validate');

let checkCurrentPassword = () => {
  return check('current_password')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('change_password.current_password_required');
    })
    .isLength({ min: authValidate.password.minLength, max: authValidate.password.maxLength })
    .withMessage((value, { req, loc, path }) => {
      return req.__('change_password.current_password_length', {
        min: authValidate.password.minLength,
        max: authValidate.password.maxLength,
      });
    });
};

let checkNewPassword = () => {
  return check('new_password')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('change_password.new_password_required');
    })
    .isLength({ min: authValidate.password.minLength, max: authValidate.password.maxLength })
    .withMessage((value, { req, loc, path }) => {
      return req.__('change_password.new_password_length', {
        min: authValidate.password.minLength,
        max: authValidate.password.maxLength,
      });
    });
};

let checkConfirmPassword = () => {
  return check('confirm_password')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('change_password.confirm_password_required');
    })
    .custom((value, { req, loc, path }) => {
      if (value !== req.body.new_password) {
        throw new Error(req.__('password_dont_match'));
      }

      return value;
    });
};

module.exports = {
  checkCurrentPassword,
  checkNewPassword,
  checkConfirmPassword,
};
