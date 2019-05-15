module.exports = {
  CLIENT_ORIGIN: process.env.NODE_ENV === 'production' ? process.env.CLIENT_ORIGIN : 'http://localhost:3000',
  LIMIT_ITEM_SHOW: 30,
};
