import Http from './../utils/Http';

export function getListRoomsByUser({ page, filter_type }) {
  return new Http().authenticated().get(`/rooms/index?page=${page}&&filter_type=${filter_type}`);
}

export function getQuantityRoomsByUserId(filter_type) {
  return new Http().authenticated().get(`/rooms/get-total-rooms-by-user?filter_type=${filter_type}`);
}

export function getMembersOfRoom(roomId) {
  return new Http().authenticated().get(`/members/rooms?roomId=${roomId}`);
}

export function deleteRoom(roomId) {
  return new Http().authenticated().delete('/delete-room', roomId);
}

export function createRoom(data) {
  return new Http().authenticated().post('/create-room', data);
}

export function getInfoRoomWithInvitionCode(code) {
  return new Http().authenticated().get(`/r/${code}`);
}

export function sendJoinRoomRequest(data) {
  return new Http().authenticated().post('/rooms/request/add', data);
}
