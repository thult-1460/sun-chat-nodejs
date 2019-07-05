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

export function getUserAvatarUrl (avatar = null) {
  return avatar ? `${systemConfig.USER_AVATAR_DIR}${avatar}` : `${systemConfig.DEFAULT_AVATAR_USER_DIR}`;
}

export function getRoomAvatarUrl (avatar = null) {
  return avatar ? `${systemConfig.ROOM_AVATAR_DIR}${avatar}` : `${systemConfig.DEFAULT_ROOM_AVATAR_DIR}`;
}

export function saveSizeComponentsChat () {
  let sideBarW = document.getElementsByClassName('side-bar')[0].offsetWidth;
  let descW = document.getElementsByClassName('description-chat')[0].offsetWidth;
  document.getElementsByClassName('chat-room')[0].style.width = (window.innerWidth - sideBarW - descW) + 'px';
  localStorage.setItem('sideBarW', sideBarW);
  localStorage.setItem('descW', descW);
}
