const { check } = require('express-validator/check');
const { roomValidate, avatarValidate } = require('./../../../config/validate');
const Room = require('../../models/room.js');

let checkContent = () => {
  return check('content')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('task.validate.content.required');
    });
};
let checkStartDay = () => {
  return check('start')
    .optional()
    .custom(async (value, { req }) => {
      if (value !== '' && new Date(value).toString() == 'Invalid Date') {
        throw Error(req.__('task.validate.start_date.not_date'));
      }
    });
};
let checkDueDay = () => {
  return check('due')
    .optional()
    .custom(async (value, { req }) => {
      if (value !== '' && new Date(value).toString() == 'Invalid Date') {
        throw Error(req.__('task.validate.end_date.not_date'));
      } else {
        const startDate = new Date(req.body.start);
        const dueDate = new Date(req.body.due);

        if (dueDate < startDate) {
          throw Error(req.__('task.validate.end_date.expire'));
        }
      }
    });
};
let checkAssignees = () => {
  return check('users')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('task.validate.users.required');
    })
    .optional()
    .custom(async (value, { req }) => {
      if (value !== '' && (!Array.isArray(value) || !value.length)) {
        throw Error(req.__('task.validate.users.not_array'));
      }
    });
};

module.exports = {
  checkContent,
  checkStartDay,
  checkDueDay,
  checkAssignees,
};
