import Http from './../utils/Http';

export function setNicknames(data, currentRoomId = null) {
  return new Http().authenticated().post(`/nicknames/rooms/${currentRoomId}`, data);
}
