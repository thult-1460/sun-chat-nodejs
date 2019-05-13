const { check } = require('express-validator/check');
const {authValidate} = require('./../../../config/validate');
const mongoose = require('mongoose');
const User = mongoose.model('User');

let checkName = () => {
  return check('name')
    .not().isEmpty().withMessage((value, {req, loc, path}) => {
      return req.__('name_required');
    })
    .isLength({ min: authValidate.name.minLength, max: authValidate.name.maxLength })
    .withMessage((value, {req, loc, path}) => {
      return req.__('name_length', {min: authValidate.name.minLength, max: authValidate.name.maxLength});
    })
}

let checkUsername = () => {
  return check('username')
    .not().isEmpty().withMessage((value, {req, loc, path}) => {
      return req.__('username_required');
    }).isLength({ min: authValidate.username.minLength, max: authValidate.username.maxLength })
      .withMessage((value, {req, loc, path}) => {
        return req.__('username_length', {min: authValidate.username.minLength, max: authValidate.username.maxLength});
    })
    .custom(async (value, {req}) => {
      let user = await User.findOne({ username: value });

      if (user) {
        throw new Error(req.__('name_already_exist'));
      } else {
        return value;
      }
    })
}

let checkEmail = () => {
  return check('email')
    .matches('^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+\.)?[a-zA-Z]+\.)?(sun-asterisk)\.com$')
    .withMessage((value, {req, loc, path}) => {
      return req.__('invalid_email');
    })
    .isLength({ max: authValidate.email.maxLength })
    .withMessage((value, {req, loc, path}) => {
      return req.__('email_length', {max: authValidate.username.maxLength});
    })
    .custom(async (value, {req}) => {
      let user = await User.findOne({ email: value });

      if (user) {
        throw new Error(req.__('email_already_exist'));
      } else {
        return value;
      }
    })
}

let checkPassword = () => {
  return check('password')
    .not().isEmpty().withMessage((value, {req, loc, path}) => {
      return req.__('password_required'); 
    })
    .isLength({ min: authValidate.password.minLength, max: authValidate.password.maxLength })
    .withMessage((value, {req, loc, path}) => {
      return req.__('password_length', {min: authValidate.password.minLength, max: authValidate.password.maxLength});
    })
    .custom((value, {req, loc, path}) => {
      if (value !== req.body.password_confirmation) {
        throw new Error(req.__('password_dont_match'));
      } else {
        return value
      }
    })
}

module.exports = {
  checkName,
  checkUsername,
  checkEmail,
  checkPassword
}

