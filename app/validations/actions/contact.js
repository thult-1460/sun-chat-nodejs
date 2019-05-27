const { check } = require('express-validator/check');

let checkInputSearchContact = () => {
  return check('searchText')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('contact.required_input_search.required_input_search');
    });
};

module.exports = {
  checkInputSearchContact,
};
