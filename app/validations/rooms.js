const { checkRoomName, checkInvitationCode, checkImgFile } = require('./actions/createRoom');

exports.validate = (type, app) => {
  switch (type) {
    case 'create': {
      return [checkRoomName(), checkInvitationCode(), checkImgFile()];
    }
  }
};
