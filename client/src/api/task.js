import Http from './../utils/Http';

export function createTask(roomId, data) {
  return new Http().authenticated().post(`/rooms/${roomId}/tasks`, data);
}

export function editTask(roomId, taskId, data) {
  return new Http().authenticated().post(`/rooms/${roomId}/tasks/${taskId}`, data);
}

export function getTasksOfRoom(roomId, type) {
  let typeSelect = type == undefined ? '' : `?type=${type}`;
  return new Http().authenticated().get(`/rooms/${roomId}/tasks${typeSelect}`);
}
