import systemConfig from './../config/configServer';
const jwt = require('jsonwebtoken');

export function checkExpiredToken () {
  const token = localStorage.getItem('token');
  const jwtSecret = systemConfig.JWT_SECRET;

  try {
    if (token) {
      let decoded = jwt.verify(token, jwtSecret);

      if (decoded) {
        return true;
      }
    }

    throw new Error(); 
  } catch(err) {
    localStorage.removeItem('token');

    return false;
  }
}

export function getUserAvatarUrl (avatar) {
  return `${systemConfig.USER_AVATAR_DIR}${avatar}`;
}

export function getRoomAvatarUrl (avatar) {
  return `${systemConfig.ROOM_AVATAR_DIR}${avatar}`;
}
