const config = require('../../../config/config');

module.exports = {
  confirmEmail: (id, token) => ({
    subject: 'Application Confirm Email',
    html: `
      <a href='${config.CLIENT_ORIGIN}/confirm/${id}/${token}'>
        click to confirm email
      </a>
    `,
    text: `Copy and paste this link: ${
      config.CLIENT_ORIGIN
    }/confirm/${id}/${token}`,
  }),
};
