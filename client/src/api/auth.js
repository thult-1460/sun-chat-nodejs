import Http from './../utils/Http';

export function getApiLogin(data) {
  return new Http().post('/login', data);
}

export function register(data) {
  return new Http().post('/signup', data);
}

export function apiChangePassword(data) {
  return new Http().authenticated().post('/change_password', data);
}

export function sendMailResetPassword(data) {
  return new Http().post('/send-mail-reset-password', data)
}

export function resetPassword(data) {
  return new Http().post('/reset-password', data)
}

export function confirmEmail(data) {
  const { id, active_token } = data;

  return new Http().get('/confirm/' + id + '/' + active_token);
}
