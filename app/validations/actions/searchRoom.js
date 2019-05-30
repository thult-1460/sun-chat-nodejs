const { check } = require('express-validator/check');
const { roomValidate } = require('./../../../config/validate');

let checkTextSearch = () => {
  return check('subName')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('room.search.text_search_required');
    })
    .isLength({ min: roomValidate.text_search.minLength })
    .withMessage((value, { req, loc, path }) => {
      return req.__('room.search.length_text_search', {
        min: roomValidate.text_search.minLength,
      });
    });
};

module.exports = {
  checkTextSearch,
};
