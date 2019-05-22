import Http from './../utils/Http';

export function getListRoomsByUser(page) {
  return new Http().authenticated().get(`/rooms/index?page=${page}`);
}

export function getAllRoomsByUserNumber() {
  return new Http().authenticated().get('/rooms/get-total-rooms-by-user');
}
