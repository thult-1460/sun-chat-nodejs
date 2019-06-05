const { check } = require('express-validator/check');
const { roomValidate } = require('./../../../config/validate');
const Room = require('../../models/room.js');

let checkRoomName = () => {
  return check('name')
    .optional()
    .custom(async (value, { req }) => {
      if (value !== '' && (value.length < roomValidate.name.minLength || value.length > roomValidate.name.maxLength)) {
        throw Error(req.__('room.name_length', { min: roomValidate.name.minLength, max: roomValidate.name.maxLength }));
      }
    });
};

let checkInvitationCode = () => {
  return check('invitation_code')
    .not()
    .isEmpty()
    .withMessage((value, { req, loc, path }) => {
      return req.__('room.invitation_code_required');
    })
    .isLength({ min: roomValidate.invitation_code.minLength, max: roomValidate.invitation_code.maxLength })
    .withMessage((value, { req, loc, path }) => {
      return req.__('room.invitation_code_length', {
        min: roomValidate.invitation_code.minLength,
        max: roomValidate.invitation_code.maxLength,
      });
    })
    .matches('^[A-Za-z0-9_-]*$')
    .withMessage((value, { req, loc, path }) => {
      return req.__('room.format_invitation_code');
    })
    .custom(async (value, { req }) => {
      let room = {};

      if (req.params.roomId === undefined) {
        room = await Room.findOne({ invitation_code: value });
      } else {
        room = await Room.findOne({ _id: { $ne: req.params.roomId }, invitation_code: value });
      }

      if (room) {
        throw new Error(req.__('room.invitation_code_unique'));
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
        throw Error(req.__('room.unknown_file'));
      }

      let imgSize = parseInt(value.replace(/=/g, '').length * 0.75) / 1024 / 1024;

      if (imgSize > roomValidate.IMG_SIZE) {
        throw Error(
          req.__('room.create.upload_file_failed', {
            max: roomValidate.IMG_SIZE,
          })
        );
      }

      return value;
    });
};

module.exports = {
  checkRoomName,
  checkInvitationCode,
  checkImgFile,
};
