import Http from './../utils/Http';

export function createTask(roomId, data) {
  return new Http().authenticated().post(`/rooms/${roomId}/tasks`, data);
}
