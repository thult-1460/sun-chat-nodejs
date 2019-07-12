const { checkRoomName, checkInvitationCode, checkImgFile } = require('./actions/createRoom');
const { checkContent, checkStartDay, checkDueDay, checkAssignees } = require('./actions/createTask');

exports.validate = (type, app) => {
  switch (type) {
    case 'create': {
      return [checkRoomName(), checkInvitationCode(), checkImgFile()];
    }
    case 'createTask': {
      return [checkContent(), checkStartDay(), checkDueDay(), checkAssignees()];
    }
  }
};
