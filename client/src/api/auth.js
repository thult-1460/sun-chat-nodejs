import Http from './../utils/Http';

export function getApiLogin(data) {
  return new Http().post('/login', data)
}

export function register(data) {
    return new Http().post('/signup', data);
}

export function confirmEmail(data) {
	const { id, active_token } = data;

    return new Http().get('/confirm/' + id + '/' + active_token);
}
