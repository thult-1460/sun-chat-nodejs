const { check } = require('express-validator/check');
const config = require('./../../../config/config');

let checkStatus = () => {
  return check('status')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('task.validate.status.required');
    })
    .optional()
    .custom(async (value, { req }) => {
      let arrStatus = Object.values(config.TASK.STATUS);

      if (!arrStatus.includes(value)) {
        throw Error(req.__('task.validate.status.not_exist'));
      }
    });
};

let checkPercent = () => {
  return check('percent')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('task.validate.assignees.required');
    })
    .optional()
    .custom(async (value, { req }) => {
      let { status } = req.body;

      if (
        (status == config.TASK.STATUS.IN_PROGRESS || status == config.TASK.STATUS.PENDING) &&
        (value > config.TASK.PERCENT.DONE || value < 0)
      ) {
        throw Error(req.__('task.validate.percent.failed', { min: 1, max: config.TASK.PERCENT.DONE }));
      } else if (status == config.TASK.STATUS.DONE && value != config.TASK.PERCENT.DONE) {
        throw Error(req.__('task.validate.percent.status_done_failed', { max: config.TASK.PERCENT.DONE }));
      }
    });
};

module.exports = {
  checkStatus,
  checkPercent,
};
