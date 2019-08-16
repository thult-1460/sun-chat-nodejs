import Http from './../utils/Http';

export function getListRoomsByUser(page, filter_type) {
  return new Http().authenticated().get(`/rooms/index?page=${page}&filter_type=${filter_type}`);
}

export function getListRoomsBySubName(text) {
  return new Http().authenticated().get(`/rooms/get-rooms-by-sub-name?sub_name=${text}`);
}

export function getQuantityRoomsByUserId(filter_type) {
  return new Http().authenticated().get(`/rooms/get-total-rooms-by-user?filter_type=${filter_type}`);
}

export function deleteRoom(roomId) {
  return new Http().authenticated().delete('/delete-room', roomId);
}

export function createRoom(data) {
  return new Http().authenticated().post('/rooms', data);
}

export function editRoom(roomId, data) {
  return new Http().authenticated().put(`/rooms/${roomId}/edit`, data);
}

export function getInfoRoomWithInvitionCode(code) {
  return new Http().authenticated().get(`/r/${code}`);
}

export function sendRequestJoinRoom(data) {
  return new Http().authenticated().post('/rooms/requests/add', data);
}

export function getMembersOfRoom(roomId) {
  return new Http().authenticated().get(`/rooms/${roomId}/members`);
}

export function deleteMember(data) {
  return new Http().authenticated().delete('/rooms/delete-member', data);
}

export function getListContactNotMember({ roomId, subName }) {
  return new Http().authenticated().get(`/list-contact-not-member?roomId=${roomId}&&subName=${subName}`);
}

export function addMembers({ roomId, users }) {
  return new Http().authenticated().post(`/rooms/${roomId}/add-member`, { users: users });
}

export function getInforRoom(roomId) {
  return new Http().authenticated().get('rooms/' + roomId);
}

export function getRequests(roomId, page) {
  return new Http().authenticated().get(`/rooms/${roomId}/requests?page=${page}`);
}

export function getNumberOfRequests(roomId) {
  return new Http().authenticated().get(`/rooms/${roomId}/total-requests`);
}

export function acceptRequests(roomId, requestIds) {
  return new Http().authenticated().post(`/rooms/${roomId}/accept-requests`, requestIds);
}

export function rejectRequests(roomId, requestIds) {
  return new Http().authenticated().post(`/rooms/${roomId}/reject-requests`, requestIds);
}

export function togglePinnedRoom(roomId) {
  return new Http().authenticated().post(`/rooms/${roomId}/pinned-room`);
}

export function changeRoleMember(data) {
  return new Http().authenticated().post('/rooms/change-role-member', data);
}

export function loadMessages(roomId) {
  return new Http().authenticated().get(`/rooms/${roomId}/messages`);
}

export function loadUnreadNextMessages(roomId, currentMsgId) {
  return new Http().authenticated().get(`/rooms/${roomId}/messages?currentMsgId=${currentMsgId}`);
}

export function loadPrevMessages(roomId, currentMsgId = null) {
  return new Http().authenticated().get(`/rooms/${roomId}/messages?prevMsgFlag=1` + (currentMsgId ? `&currentMsgId=${currentMsgId}` : ''));
}

export function sendMessage(roomId, data) {
  return new Http().authenticated().post(`/rooms/${roomId}/messages`, data);
}

export function updateMessage(roomId, messageId, data) {
  return new Http().authenticated().post(`/rooms/${roomId}/messages/${messageId}`, data);
}

export function deleteMessage({ roomId, messageId }) {
  return new Http().authenticated().delete(`/rooms/${roomId}/messages/${messageId}`);
}

export function getDirectRoomId(userId) {
  return new Http().authenticated().get(`/get-direct-room-id/${userId}`);
}

export function leaveRoom(roomId) {
  return new Http().authenticated().post(`rooms/${roomId}/leave-room`);
}

export function editDescOfRoom(roomId, desc) {
  return new Http().authenticated().post(`rooms/${roomId}/edit-desc`, desc);
}

export function sendCallingRequest(data, roomId) {
  return new Http().authenticated().post(`rooms/${roomId}/send-calling-request`, data);
}

export function getListNicknameByUserInRoom(roomId) {
  return new Http().authenticated().get(`rooms/${roomId}/nicknames`);
}

export function reactionMsg(roomId, data) {
  return new Http().authenticated().post(`rooms/${roomId}/reaction-msg`, data);
}

export function getReactionUserListOfMsg(roomId, msgId, reactionTag) {
  return new Http().authenticated().get(`rooms/${roomId}/messages/${msgId}/reactions/${escape(reactionTag)}`);
}

export function getMessageInfo(roomId, msgId) {
  return new Http().authenticated().get(`rooms/${roomId}/messages/${msgId}`);
}
