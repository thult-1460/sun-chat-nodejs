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
