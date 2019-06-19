const config = {
  API_URL: process.env.REACT_APP_API_URL,
  SOCKET_ENDPOINT: process.env.REACT_APP_SOCKET_ENDPOINT,
  LOCALE: process.env.REACT_APP_LOCALE || 'en',
  USER_AVATAR_DIR: '/uploads/',
  ROOM_AVATAR_DIR: '/uploads/',
};

export default config;
