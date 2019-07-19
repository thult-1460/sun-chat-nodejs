import Http from './../utils/Http';

export function getUser() {
  return new Http().authenticated().get('/users')
}

export function getUserById(userId) {
  return new Http().authenticated().get(`/users/${userId}`)
}

export function updateUser(param) {
  return new Http().authenticated().post('/update/user', param)
}

