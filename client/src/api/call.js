import Http from './../utils/Http';

export function createLiveChat(param) {
  return new Http().authenticated().post(`/live-chat/create`, param);
}

export function offerJoinLiveChat(param) {
  return new Http().authenticated().post(`/live-chat/offer-join`, param);
}

export function checkMaster(param) {
  return new Http().authenticated().post(`/live-chat/check-master`, param);
}

export function acceptMember(param) {
  return new Http().authenticated().post(`/accept-member/${param.memberId}`, param);
}