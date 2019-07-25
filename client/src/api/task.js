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

export function deleteTask(roomId, taskId) {
  return new Http().authenticated().delete(`/rooms/${roomId}/tasks/${taskId}`);
}

export function doneTask(roomId, taskId) {
  return new Http().authenticated().post(`/rooms/${roomId}/done-tasks/${taskId}`);
}

export function rejectTask(roomId, taskId) {
  return new Http().authenticated().post(`/rooms/${roomId}/reject-tasks/${taskId}`);
}
