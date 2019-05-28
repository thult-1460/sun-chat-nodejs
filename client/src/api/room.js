import Http from './../utils/Http';

export function getListRoomsByUser({ page, filter_type }) {
  return new Http().authenticated().get(`/rooms/index?page=${page}&&filter_type=${filter_type}`);
}

export function getQuantityRoomsByUserId(filter_type) {
  return new Http().authenticated().get(`/rooms/get-total-rooms-by-user?filter_type=${filter_type}`);
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

export function sendRequestJoinRoom(data) {
  return new Http().authenticated().post('/rooms/requests/add', data);
}

export function getMembersOfRoom(roomId) {
  return new Http().authenticated().get(`/rooms/members?roomId=${roomId}`);
}

export function deleteMember(data) {
  return new Http().authenticated().delete('/delete-member', data);
}
