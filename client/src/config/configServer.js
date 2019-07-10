const config = {
  API_URL: process.env.REACT_APP_API_URL,
  SOCKET_ENDPOINT: process.env.REACT_APP_SOCKET_ENDPOINT,
  LOCALE: process.env.REACT_APP_LOCALE || 'en',
  USER_AVATAR_DIR: '/uploads/user_avatar/',
  ROOM_AVATAR_DIR: '/uploads/room_avatar/',
  DEFAULT_ROOM_AVATAR_DIR: require('../images/default_avatar/room_default.png'),
  DEFAULT_AVATAR_USER_DIR: require('../images/default_avatar/user_default.png'),
  JWT_SECRET: process.env.REACT_APP_JWT_SECRET,
  URL_NOTIFICATION: require('../sound/notification.mp3')
};

export default config;
