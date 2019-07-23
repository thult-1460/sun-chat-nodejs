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
  return check('assignees')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('task.validate.assignees.required');
    })
    .optional()
    .custom(async (value, { req }) => {
      if (value !== '' && (!Array.isArray(value) || !value.length)) {
        throw Error(req.__('task.validate.assignees.not_array'));
      } else {
        const { roomId } = req.params;
        const members = await Room.getMembersOfRoom(roomId);
        let membersId = [];

        members.map(m => {
          membersId.push(m.user._id.toString());
        });

        for (let i = 0; i < value.length; i++) {
          if (membersId.indexOf(value[i]) == -1) {
            throw Error(req.__('task.validate.assignees.not_member'));
          }
        }
      }
    });
};

module.exports = {
  checkContent,
  checkStartDay,
  checkDueDay,
  checkAssignees,
};
