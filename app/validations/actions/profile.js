const { check } = require('express-validator/check');
const { authValidate, avatarValidate } = require('./../../../config/validate');
const mongoose = require('mongoose');
const User = mongoose.model('User');

let checkNameEdit = () => {
  return check('name')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('name_required');
    })
    .isLength({ min: authValidate.name.minLength, max: authValidate.name.maxLength })
    .withMessage((value, { req, loc, path }) => {
      return req.__('name_length', { min: authValidate.name.minLength, max: authValidate.name.maxLength });
    });
};

let checkUsernameEdit = () => {
  return check('username')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('username_required');
    })
    .isLength({ min: authValidate.username.minLength, max: authValidate.username.maxLength })
    .withMessage((value, { req, loc, path }) => {
      return req.__('username_length', { min: authValidate.username.minLength, max: authValidate.username.maxLength });
    })
    .custom(async (value, { req }) => {
      let user = await User.findOne({ _id: { $ne: req.decoded._id }, username: value });

      if (user) {
        throw new Error(req.__('user_name_already_exist'));
      } else {
        return value;
      }
    });
};

let checkEmailEdit = () => {
  return check('email')
    .matches('^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+.)?[a-zA-Z]+.)?(sun-asterisk).com$')
    .withMessage((value, { req, loc, path }) => {
      return req.__('invalid_email');
    })
    .isLength({ max: authValidate.email.maxLength })
    .withMessage((value, { req, loc, path }) => {
      return req.__('email_length', { max: authValidate.username.maxLength });
    })
    .custom(async (value, { req }) => {
      let user = await User.findOne({ _id: { $ne: req.decoded._id }, email: value });

      if (user) {
        throw new Error(req.__('email_already_exist'));
      } else {
        return value;
      }
    });
};

let checkImgFile = () => {
  return check('avatar')
    .optional()
    .custom(async (value, { req }) => {
      if (
        value == null ||
        value.length == 0 ||
        value.includes(' ') ||
        value.includes('\t') ||
        value.includes('\r') ||
        value.includes('\n')
      ) {
        throw Error(req.__('user.unknown_file'));
      }

      let imgSize = parseInt(value.replace(/=/g, '').length * 0.75) / 1024 / 1024;

      if (imgSize > avatarValidate.IMG_SIZE) {
        throw Error(
          req.__('user.upload_file_failed', {
            max: avatarValidate.IMG_SIZE,
          })
        );
      }

      return value;
    });
};

let checkPhoneNumber = () => {
  return check('phone')
    .matches('^[0-9\-\+]{9,15}$')
    .withMessage((value, { req, loc, path }) => {
      throw Error(
          req.__('user.incorrect_phone_number_format')
        );
    });
};

module.exports = {
  checkNameEdit,
  checkUsernameEdit,
  checkEmailEdit,
  checkImgFile,
  checkPhoneNumber,
};
