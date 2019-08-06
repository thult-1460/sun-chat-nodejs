import Http from './../utils/Http';

export function setNicknames(data) {
  return new Http().authenticated().post('/nicknames', data);
}
