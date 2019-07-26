import systemConfig from './../config/configServer';
import avatarConfig from '../config/avatar';
import configEmoji from '../config/emoji';
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
  return avatar ? `${avatarConfig.USER_AVATAR_DIR}${avatar}` : `${avatarConfig.DEFAULT_AVATAR_USER_DIR}`;
}

export function getRoomAvatarUrl (avatar = null) {
  return avatar ? `${avatarConfig.ROOM_AVATAR_DIR}${avatar}` : `${avatarConfig.DEFAULT_ROOM_AVATAR_DIR}`;
}

export function getEmoji(emoji) {
  return `${configEmoji.EMOJI_DIR}${emoji}`;
}

export function saveSizeComponentsChat () {
  let sideBarW = document.getElementsByClassName('side-bar')[0].offsetWidth;
  let descW = document.getElementsByClassName('description-chat')[0];
  localStorage.setItem('sideBarW', sideBarW);

  if (descW) {
    document.getElementsByClassName('chat-room')[0].style.width = (window.innerWidth - sideBarW - descW.offsetWidth) + 'px';
    localStorage.setItem('descW', descW.offsetWidth);
  }
}
