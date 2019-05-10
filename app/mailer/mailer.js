const nodemailer = require('nodemailer');

const credentials = {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(credentials);

module.exports = async (to, content) => {
  const contacts = {
    from: process.env.MAIL_FROM,
    to,
  };

  const email = Object.assign({}, content, contacts);

  // This file is imported into the controller as 'sendEmail'. Because
  // 'transporter.sendMail()' below returns a promise we can write code like this
  // in the contoller when we are using the sendEmail() function.
  //
  //  sendEmail()
  //   .then(() => doSomethingElse())
  //
  await transporter
    .sendMail(email)
    .then(function(info) {
      console.log(info);
    })
    .catch(function(err) {
      console.log(err);
    });
};
