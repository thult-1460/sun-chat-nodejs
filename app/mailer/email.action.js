const sendEmail = require('./mailer');
const templates = require('./templates/email.templates');

// The callback that is invoked when the user submits the form on the client.
exports.activeEmail = async (user, resend = false) => {
  if (user && !user.active) {
    // Have already seen this email address. But the user has not
    // clicked on the confirmation link. Send another confirmation email
    return await sendEmail(user.email, templates.confirmEmail(user._id, user.active_token)).then(() =>
      resend ? __('mail.resend_active_mail') : __('mail.send_active_mail')
    );
  } else {
    // The user has already confirmed this email address
    return __('mail.alreadyConfirmed');
  }
};

exports.resetPassword = async (user, token, resend = false) => {
  return await sendEmail(user.email, templates.resetPassword(token)).then(() =>
    resend ? __('mail.resend') : __('mail.send')
  );
};
