import Http from './../utils/Http';

export function getapiLogin(data) {
  return new Http().post('api/login', data)
}
