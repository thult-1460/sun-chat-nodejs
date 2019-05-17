const { check } = require('express-validator/check');
const { authValidate } = require('./../../../config/validate');

let checkEmail = () => {
  return check('email')
    .matches('^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+.)?[a-zA-Z]+.)?(sun-asterisk).com$')
    .withMessage((value, { req }) => {
      return req.__('invalid_email');
    })
    .isLength({ max: authValidate.email.maxLength })
    .withMessage((value, { req }) => {
      return req.__('email_length', { max: authValidate.username.maxLength });
    });
};

module.exports = {
  checkEmail,
};
