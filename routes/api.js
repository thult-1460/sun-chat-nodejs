'use strict';

const express = require('express');
const router = express.Router();

// Require controller
const auth = require('../app/controllers/auth/authController');
//User
const users = require('../app/controllers/users');
const usersValidate = require('../app/validations/users.js');

// Change language
router.get('/language/:lang', (req, res) => {
  let { lang } = req.params;
  res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
  res.status(200).json({ msg: __('changed_lang', { lang: lang }) });
});

// Users
router.post('/login', users.apiLogin);
router.post('/signup', usersValidate.validate('register'), users.apiSignup);
router.get('/confirm/:userId/:active_token', users.confirmEmail);
//Contact
router.get('/my-contact-request', auth.jwtMiddleware, users.contactRequest);
router.get('/my-contact-request-number', auth.jwtMiddleware, users.totalContactRequest);

router.post(
  '/send-mail-reset-password',
  usersValidate.validate('sendMailResetPassword'),
  users.apiSendMailResetPassword
);
router.post('/reset-password', usersValidate.validate('resetPassword'), users.apiResetPassword);

router.param('userId', users.load);
router.post('/change_password', auth.jwtMiddleware, usersValidate.validate('change_password'), users.apiChangePassword);

module.exports = router;
